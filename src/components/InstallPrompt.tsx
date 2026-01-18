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
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:w-80 z-[100] animate-slide-up">
            <div className="bg-card/95 backdrop-blur-md border border-primary/20 p-4 rounded-xl shadow-2xl flex flex-col gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 shadow-inner border border-border">
                        <img src="/pwa-icon-192.png" alt="App Icon" className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm leading-tight">Install Attendance Pro</h3>
                        <p className="text-xs text-muted-foreground">Add to home screen for offline access and native experience.</p>
                    </div>
                </div>
                <div className="flex gap-2 justify-end">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsVisible(false)}
                        className="text-xs px-4"
                    >
                        Later
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleInstallClick}
                        className="bg-primary hover:bg-primary/90 text-white shadow-md flex items-center gap-2 text-xs px-4"
                    >
                        <Download className="w-3 h-3" />
                        Install
                    </Button>
                </div>
            </div>
        </div>
    );
};
