// components/Layout.tsx
import Navbar from "./components/NavBar";
import Footer from "./components/Footer";
import React from "react";
interface LayoutProps {
    children: React.ReactNode;
    onWalletConnect: (publicKeyString: string) => void; // Type the onWalletConnect prop
}
const Layout: React.FC<LayoutProps> = ({ children, onWalletConnect }) => {
    return (
        <div
            style={{
                backgroundImage: `url('public/TheTokenLab-App_BG-Transparent.svg')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundAttachment: 'fixed',
                minHeight: '100vh',
            }}
        >
            <Navbar onWalletConnect={onWalletConnect} />
            <main>{children}</main>
            <Footer />
        </div>
    );
};

export default Layout;
