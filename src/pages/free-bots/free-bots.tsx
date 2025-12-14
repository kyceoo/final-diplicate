import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import Button from '@/components/shared_ui/button';
import Text from '@/components/shared_ui/text';
import { DBOT_TABS } from '@/constants/bot-contents';
import { useStore } from '@/hooks/useStore';
import { localize } from '@deriv-com/translations';
import { getBotsManifest, prefetchAllXmlInBackground, fetchXmlWithCache } from '@/utils/freebots-cache';
import './free-bots.scss';

interface BotData {
    name: string;
    description: string;
    difficulty: string;
    strategy: string;
    features: string[];
    xml: string;
}

const DEFAULT_FEATURES = ['Automated Trading', 'Risk Management', 'Profit Optimization'];


const FreeBots = observer(() => {
    const { dashboard, app } = useStore();
    const { active_tab, setActiveTab, setPendingFreeBot } = dashboard;
    const [availableBots, setAvailableBots] = useState<BotData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Show selected bots from public/xml (explicit curated list)
    const getXmlFiles = () => {
        return [
            'MATRIX V5 SPEEDBOT.xml (1).xml',
            'MKOREAN SV6 BOT (1).xml',
            'NEXUS SPEEDBOT V5.xml (1).xml',
            'RISE AND FALL AUTO BOT.xml (1).xml',
            'Titans V3.xml (1).xml',
            'Xenon RV1.xml',
        ];
    };

    // Wait for workspace to be available
    const waitForWorkspace = (maxAttempts = 10, delay = 500) => {
        return new Promise((resolve, reject) => {
            let attempts = 0;

            const checkWorkspace = () => {
                attempts++;
                if (window.Blockly?.derivWorkspace) {
                    console.log('Workspace is ready!');
                    resolve(window.Blockly.derivWorkspace);
                } else if (attempts >= maxAttempts) {
                    reject(new Error('Workspace not available after maximum attempts'));
                } else {
                    console.log(`Waiting for workspace... attempt ${attempts}/${maxAttempts}`);
                    setTimeout(checkWorkspace, delay);
                }
            };

            checkWorkspace();
        });
    };

    // Load bot into builder
    const loadBotIntoBuilder = async (bot: BotData) => {
        try {
            if (bot.xml) {
                console.log('Loading bot:', bot.name);
                console.log('Blockly workspace available:', !!window.Blockly?.derivWorkspace);

                // Flag the selected bot for the Bot Builder to load after navigation
                setPendingFreeBot({ name: bot.name, xml: bot.xml });

                // Navigate to Bot Builder; loading will be handled when workspace is ready
                setActiveTab(DBOT_TABS.BOT_BUILDER);

                console.log('Navigating to Bot Builder to load bot:', bot.name);
            }
        } catch (error) {
            console.error('Error loading bot:', error);
        }
    };

    // Load bots with instant UI and progressive loading (no blocking spinner)
    useEffect(() => {
        const loadBots = async () => {
            if (active_tab !== DBOT_TABS.FREE_BOTS) return;

            setError(null);

            // 0) Immediately render skeleton cards from a small fallback list
            const fallback = getXmlFiles().map(file => ({ name: file.replace('.xml', ''), file }));
            const initialSkeleton: BotData[] = fallback.map(item => ({
                name: (item.name || item.file.replace('.xml', '')).replace(/[_-]/g, ' '),
                description: `Advanced trading bot: ${(item.name || item.file.replace('.xml', '')).replace(/[_-]/g, ' ')}`,
                difficulty: 'Intermediate',
                strategy: 'Multi-Strategy',
                features: DEFAULT_FEATURES,
                xml: '',
            }));
            setAvailableBots(initialSkeleton);
            setIsLoading(false); // hide "Loading free bots..." right away

            try {
                // Force use of explicit list only; ignore remote manifest
                const manifest = getXmlFiles().map(file => ({ name: file.replace('.xml',''), file }));

                // Update skeletons to our explicit list
                const skeletonBots: BotData[] = manifest.map(item => ({
                    name: (item.name || item.file.replace('.xml', '')).replace(/[_-]/g, ' '),
                    description: `Advanced trading bot: ${(item.name || item.file.replace('.xml', '')).replace(/[_-]/g, ' ')}`,
                    difficulty: 'Intermediate',
                    strategy: 'Multi-Strategy',
                    features: DEFAULT_FEATURES,
                    xml: '',
                }));
                setAvailableBots(skeletonBots);

                // 3) Load XMLs progressively in background
                const loadedBots: BotData[] = [];
                for (let i = 0; i < manifest.length; i++) {
                    const item = manifest[i];
                    try {
                        const xml = await fetchXmlWithCache(item.file);
                        if (xml) {
                            const botName = (item.name || item.file.replace('.xml', '')).replace(/[_-]/g, ' ');
                            loadedBots.push({
                                name: botName,
                                description: `Advanced trading bot: ${botName}`,
                                difficulty: 'Intermediate',
                                strategy: 'Multi-Strategy',
                                features: DEFAULT_FEATURES,
                                xml,
                            });
                            setAvailableBots([...loadedBots, ...skeletonBots.slice(loadedBots.length)]);
                        }
                    } catch (err) {
                        console.warn(`Failed to load ${item.file}:`, err);
                    }
                }
            } catch (error) {
                console.error('Error loading bots:', error);
                setError('Failed to load bots. Please try again.');
            }
        };

        loadBots();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active_tab]);

    return (
        <div className='free-bots'>
            <div className='free-bots__container'>
                {isLoading ? (
                    <div className='free-bots__loading'>
                        <Text size='s' color='general'>
                            {localize('Loading free bots...')}
                        </Text>
                    </div>
                ) : error ? (
                    <div className='free-bots__error'>
                        <Text size='s' color='general'>
                            {error}
                        </Text>
                        <div style={{ marginTop: '20px' }}>
                            <Button onClick={() => window.location.reload()}>{localize('Retry')}</Button>
                        </div>
                    </div>
                ) : availableBots.length === 0 ? (
                    <div className='free-bots__empty'>
                        <Text size='s' color='general'>
                            {localize('No bots available at the moment.')}
                        </Text>
                    </div>
                ) : (
                    <div className='free-bots__grid'>
                        {availableBots.map((bot, index) => (
                            <div key={index} className='free-bot-card'>
                                <div className='free-bot-card__header'>
                                    <Text size='s' weight='bold' className='free-bot-card__title'>
                                        {bot.name}
                                    </Text>
                                    
                                    {/* Star Rating */}
                                    <div className='free-bot-card__rating'>
                                        <span className='star'>★</span>
                                        <span className='star'>★</span>
                                        <span className='star'>★</span>
                                        <span className='star'>★</span>
                                        <span className='star'>★</span>
                                    </div>
                                </div>


                                <Button
                                    className='free-bot-card__load-btn'
                                    onClick={() => loadBotIntoBuilder(bot)}
                                    primary
                                    has_effect
                                    type='button'
                                    disabled={!bot.xml} // Disable if XML not loaded yet
                                >
                                    {bot.xml ? 'LOAD PREMIUM BOT' : 'LOADING...'}
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
});

export default FreeBots;
