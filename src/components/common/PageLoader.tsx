import React from 'react';
import { Loader2 } from 'lucide-react';

export const PageLoader: React.FC = () => {
    return (
        <div className="flex items-center justify-center w-full h-full min-h-[200px]">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
    );
};
