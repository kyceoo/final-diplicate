import React from 'react';
import './dcircles.scss';

const Dcircles = () => {
    return (
        <div className='dcircles'>
            <div className='dcircles__container'>
                <iframe
                    src="/circles/index.html"
                    title="Xenon Tick Analyser"
                    className='dcircles__iframe'
                    frameBorder="0"
                    style={{ 
                        width: '100%', 
                        height: '100%', 
                        border: 'none',
                        minHeight: '600px'
                    }}
                />
            </div>
        </div>
    );
};

export default Dcircles;
