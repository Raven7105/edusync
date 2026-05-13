import React from "react";
import { cn } from "@/lib/utils";


export default function StatCard({ title, value, icon: Icon, trend, color = "primary" }) {
    const colorMap = {
        primary: "bg-primary/10 text-primary",
        accent: "bg-accent/10 text-accent",
        warning: "bg-amber-500/10 text-amber-600",
        destructive: "bg-destructive/10 text-destructive",
    };


    return (
        <div className="bg-card rounded-xl border border-border p-5 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <p className="text-sm text-muted-foreground font-medium">{title}</p>
                    <p className="text-3xl font-bold tracking-tight text-card-foreground">{value}</p>
                    {trend && (
                        <p className="text-xs text-accent font-medium">{trend}</p>
                    )}
                </div>
                <div className={cn("p-3 rounded-xl", colorMap[color])}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
        </div>
    );
}
