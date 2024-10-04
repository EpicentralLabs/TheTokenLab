import React, { useState, useEffect } from 'react';
import './ZKCompress.css';
import ErrorMessageZK from './ErrorMessageZK';
import SuccessMessage from './InitalizingMintMessage';

interface CompressProps {
    tokenName: string;
    tokenSymbol: string;
    quantity: string;
    decimals: string;
    setIsTokenNameError: (error: boolean) => void;
    setIsTokenSymbolError: (error: boolean) => void;
    setIsQuantityError: (error: boolean) => void;
    setIsDecimalsError: (error: boolean) => void;
}

const Compress: React.FC<CompressProps> = ({
                                               tokenName,
                                               tokenSymbol,
                                               quantity,
                                               decimals,
                                               setIsTokenNameError,
                                               setIsTokenSymbolError,
                                               setIsQuantityError,
                                               setIsDecimalsError
                                           }) => {
    const [showError, setShowError] = useState<boolean>(false);
    const [showSuccess, setShowSuccess] = useState<boolean>(false);

    useEffect(() => {
        // Functionality data / algorithm to compress can be implemented here
    }, []);

    const handleZKCompress = (paymentType: string) => {
        let hasError = false;

        if (!tokenName.trim()) {
            setIsTokenNameError(true);
            hasError = true;
        }
        if (!tokenSymbol.trim()) {
            setIsTokenSymbolError(true);
            hasError = true;
        }
        if (!quantity.trim()) {
            setIsQuantityError(true);
            hasError = true;
        }
        if (!decimals.trim()) {
            setIsDecimalsError(true);
            hasError = true;
        }

        if (hasError) {
            setShowError(true);
            setShowSuccess(false);
        } else {
            setShowError(false);
            setShowSuccess(true);
        }
    };

    return (
        <div className='ZKcenter'>
            <div className='ZK-button-box'>
                <h1 className="compress-button-container">
                    <button
                        className="compress-button"
                        // @ts-ignore
                        onClick={() => handleZKCompress(/*compress var*/)}
                    >
                        Use ZK Compression
                    </button>
                </h1>
            </div>
            {showError && <ErrorMessageZK />}
            {showSuccess && <SuccessMessage />}
        </div>
    );
}

export default Compress;
