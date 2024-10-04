import React from "react";
import TokenNameList from "./NameInput";
import TokenSymbolList from "./SymbolInput";
import QuantityInput from "./QuantityInput";
import DecimalsInput from "./DecimalsInput";
import DescriptionInput from "./DescriptionInput";
import PhotoInput from "./PhotoInput";

interface TokenInputsProps {
    tokenName: string; // Type for token name
    setTokenName: React.Dispatch<React.SetStateAction<string>>; // Type for setTokenName function
    tokenSymbol: string; // Type for token symbol
    setTokenSymbol: React.Dispatch<React.SetStateAction<string>>; // Type for setTokenSymbol function
    quantity: number; // Type for quantity
    setQuantity: React.Dispatch<React.SetStateAction<number>>; // Type for setQuantity function
    decimals: number; // Type for decimals
    setDecimals: React.Dispatch<React.SetStateAction<number>>; // Type for setDecimals function
    imageFile: File | null; // Type for image file
    setImageFile: React.Dispatch<React.SetStateAction<File | null>>; // Type for setImageFile function
    onImageURIChange: (uri: string) => void; // Type for the onImageURIChange function
    isError?: boolean; // Optional isError prop
}

const TokenInputs: React.FC<TokenInputsProps> = ({
                                                     tokenName,
                                                     setTokenName,
                                                     tokenSymbol,
                                                     setTokenSymbol,
                                                     quantity,
                                                     setQuantity,
                                                     decimals,
                                                     setDecimals,
                                                     imageFile,
                                                     setImageFile,
                                                     onImageURIChange,
                                                     isError, // Add the isError prop here
                                                 }) => {
    return (
        <section className="Input-grid-left-and-right">
            <div className="Input-List">
                <h1 className="listSpacing">
                    <TokenNameList
                        tokenName={tokenName}
                        setTokenName={setTokenName}
                        isError={isError ?? false}
                    />                </h1>
                <h1 className="listSpacing">
                    <TokenSymbolList
                        tokenSymbol={tokenSymbol}
                        setTokenSymbol={setTokenSymbol}
                        isError={isError ?? false} />
                </h1>
                <h1 className="listSpacing">
                    <QuantityInput
                        quantity={quantity}
                        // @ts-ignore
                        setQuantity={setQuantity} />
                </h1>
                <h1 className="listSpacing">
                    <DecimalsInput
                        decimals={String(decimals)} // Ensure decimals is a string
                        // @ts-ignore
                        setDecimals={setDecimals}
                        isError={isError ?? false}
                    />
                </h1>
                <h1 className="listSpacing">
                    <DescriptionInput />
                </h1>
            </div>
            <div className="Input-List">
                <h1>
                    <PhotoInput
                        // @ts-ignore
                        onFileUpload={setImageFile}
                        onImageURIChange={onImageURIChange}
                        // @ts-ignore
                        pathToFileURL={imageFile}
                    />
                </h1>
            </div>
        </section>
    );
};

export default TokenInputs;
