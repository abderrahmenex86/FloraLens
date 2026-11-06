export type EmptyStateIcon = 'scan' | 'sprout' | 'search';

export interface EmptyStateProps {
    iconName: EmptyStateIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
}
