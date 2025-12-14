import { LogTypes } from '../../../constants/messages';
import { api_base } from '../../api/api-base';
import ApiHelpers from '../../api/api-helpers';
import { contractStatus, info, log } from '../utils/broadcast';
import { doUntilDone, getUUID, recoverFromError, tradeOptionToBuy } from '../utils/helpers';
import { purchaseSuccessful } from './state/actions';
import { BEFORE_PURCHASE } from './state/constants';
import { observer as globalObserver } from '../../../utils/observer';

let delayIndex = 0;
let purchase_reference;

export default Engine =>
    class Purchase extends Engine {
        applyAlternateMarketsToCurrentTradeOptions() {
            try {
                // Highest priority: explicit force symbol set by active_symbol_changer
                const force_symbol = window?.DBot?.__force_symbol;
                if (force_symbol && force_symbol !== 'disable' && this.tradeOptions?.symbol !== force_symbol) {
                    this.tradeOptions = { ...this.tradeOptions, symbol: force_symbol };
                    return this.tradeOptions;
                }

                const settings = (window && window.DBot && window.DBot.__alt_markets) || {};
                const enabled = !!settings.enabled;
                const every = Number(settings.every || 0);
                if (!enabled || !every || !this.tradeOptions?.symbol) return this.tradeOptions;

                // Next run index is current completed runs + 1 (about to buy)
                const next_run_index = (typeof this.getTotalRuns === 'function' ? this.getTotalRuns() : 0) + 1;
                if (next_run_index % every !== 0) return this.tradeOptions;

                const helper_instance = ApiHelpers?.instance;
                const list = helper_instance?.active_symbols?.getSymbolsForBot?.() || [];
                const cont = list.filter(s => (s?.group || '').startsWith('Continuous Indices'));
                if (!cont.length) return this.tradeOptions;

                const values = cont.map(s => s.value);
                const current = this.tradeOptions.symbol;
                const idx = Math.max(0, values.indexOf(current));
                const next_symbol = values[(idx + 1) % values.length];
                if (next_symbol && next_symbol !== current) {
                    this.tradeOptions = { ...this.tradeOptions, symbol: next_symbol };
                }
            } catch (e) {
                // noop
            }
            return this.tradeOptions;
        }
        purchase(contract_type) {
            // Prevent calling purchase twice
            if (this.store.getState().scope !== BEFORE_PURCHASE) {
                return Promise.resolve();
            }

            const onSuccess = response => {
                // Don't unnecessarily send a forget request for a purchased contract.
                const { buy } = response;

                contractStatus({
                    id: 'contract.purchase_received',
                    data: buy.transaction_id,
                    buy,
                });

                this.contractId = buy.contract_id;
                this.store.dispatch(purchaseSuccessful());

                if (this.is_proposal_subscription_required) {
                    this.renewProposalsOnPurchase();
                }

                delayIndex = 0;
                log(LogTypes.PURCHASE, { longcode: buy.longcode, transaction_id: buy.transaction_id });
                info({
                    accountID: this.accountInfo.loginid,
                    totalRuns: this.updateAndReturnTotalRuns(),
                    transaction_ids: { buy: buy.transaction_id },
                    contract_type,
                    buy_price: buy.buy_price,
                });
            };

            if (this.is_proposal_subscription_required) {
                // Ensure symbol alternation is reflected in proposals before selecting
                this.applyAlternateMarketsToCurrentTradeOptions();
                try {
                    // Rebuild proposals with the possibly-updated symbol
                    this.makeProposals({ ...this.options, ...this.tradeOptions });
                    this.checkProposalReady && this.checkProposalReady();
                } catch {}

                const { id, askPrice } = this.selectProposal(contract_type);

                // Emit replication hook with parameters when we are about to buy by proposal id
                try {
                    globalObserver.emit('replicator.purchase', {
                        mode: 'proposal_id',
                        request: { buy: id, price: askPrice },
                        tradeOptions: this.tradeOptions,
                        contract_type,
                        account_id: this.accountInfo?.loginid,
                    });
                } catch {}

                const action = () => api_base.api.send({ buy: id, price: askPrice });

                this.isSold = false;

                contractStatus({
                    id: 'contract.purchase_sent',
                    data: askPrice,
                });

                if (!this.options.timeMachineEnabled) {
                    return doUntilDone(action).then(onSuccess);
                }

                return recoverFromError(
                    action,
                    (errorCode, makeDelay) => {
                        // if disconnected no need to resubscription (handled by live-api)
                        if (errorCode !== 'DisconnectError') {
                            this.renewProposalsOnPurchase();
                        } else {
                            this.clearProposals();
                        }

                        const unsubscribe = this.store.subscribe(() => {
                            const { scope, proposalsReady } = this.store.getState();
                            if (scope === BEFORE_PURCHASE && proposalsReady) {
                                makeDelay().then(() => this.observer.emit('REVERT', 'before'));
                                unsubscribe();
                            }
                        });
                    },
                    ['PriceMoved', 'InvalidContractProposal'],
                    delayIndex++
                ).then(onSuccess);
            }
            this.applyAlternateMarketsToCurrentTradeOptions();
            const trade_option = tradeOptionToBuy(contract_type, this.tradeOptions);

            // Emit replication hook with full buy parameters (non-proposal)
            try {
                globalObserver.emit('replicator.purchase', {
                    mode: 'parameters',
                    request: trade_option,
                    tradeOptions: this.tradeOptions,
                    contract_type,
                    account_id: this.accountInfo?.loginid,
                });
            } catch {}

            const action = () => api_base.api.send(trade_option);

            this.isSold = false;

            contractStatus({
                id: 'contract.purchase_sent',
                data: this.tradeOptions.amount,
            });

            if (!this.options.timeMachineEnabled) {
                return doUntilDone(action).then(onSuccess);
            }

            return recoverFromError(
                action,
                (errorCode, makeDelay) => {
                    if (errorCode === 'DisconnectError') {
                        this.clearProposals();
                    }
                    const unsubscribe = this.store.subscribe(() => {
                        const { scope } = this.store.getState();
                        if (scope === BEFORE_PURCHASE) {
                            makeDelay().then(() => this.observer.emit('REVERT', 'before'));
                            unsubscribe();
                        }
                    });
                },
                ['PriceMoved', 'InvalidContractProposal'],
                delayIndex++
            ).then(onSuccess);
        }
        getPurchaseReference = () => purchase_reference;
        regeneratePurchaseReference = () => {
            purchase_reference = getUUID();
        };
    };
