import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

export const InstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
        setIsVisible(false);

        if (outcome === 'accepted') {
            toast.success('Thank you for installing the app!');
        }
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 animate-bounce">
            <Button
                onClick={handleInstallClick}
                className="bg-primary hover:bg-primary/90 text-white shadow-lg flex items-center gap-2"
            >
                <Download className="w-4 h-4" />
                Install App
            </Button>
        </div>
    );
};
