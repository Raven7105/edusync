import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const cycleStyles = {
    "Maternelle": "bg-purple-100 text-purple-700 border-purple-200",
    "Primaire": "bg-blue-100 text-blue-700 border-blue-200",
    "Collège": "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export default function CycleBadge({ cycle }) {
    return (
        <Badge variant="outline" className={cn("text-xs font-medium", cycleStyles[cycle] || "")}>
            {cycle}
        </Badge>
    );
}