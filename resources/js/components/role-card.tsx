import { ArrowRight, Lock } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import type { Role } from '@/types/permission';

type RoleCardProps = {
    role: Role;
    canEdit: boolean;
    onEdit: (role: Role) => void;
};

const MAX_VISIBLE_AVATARS = 3;

export default function RoleCard({ role, canEdit, onEdit }: RoleCardProps) {
    const getInitials = useInitials();
    const visibleUsers = role.users_preview.slice(0, MAX_VISIBLE_AVATARS);
    const overflowCount = Math.max(0, role.users_count - visibleUsers.length);

    return (
        <div
            className={cn(
                'flex h-full flex-col rounded-2xl border bg-muted/40 p-5 transition-colors',
                'hover:bg-muted/60',
            )}
            data-test={`role-card-${role.name}`}
        >
            <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-semibold capitalize">
                    {role.name}
                </h3>

                {role.is_system && (
                    <Badge variant="secondary" className="gap-1 text-[10px]">
                        <Lock className="size-3" />
                        System
                    </Badge>
                )}
            </div>

            <p className="mt-3 line-clamp-3 min-h-15 flex-1 text-sm text-muted-foreground">
                {role.description ?? 'No description provided.'}
            </p>

            <div className="mt-5 flex items-center justify-between gap-3">
                <div className="flex items-center">
                    {visibleUsers.length === 0 ? (
                        <span className="text-xs text-muted-foreground">
                            No members yet
                        </span>
                    ) : (
                        <div className="flex -space-x-2">
                            {visibleUsers.map((user) => (
                                <Avatar
                                    key={user.id}
                                    className="size-7 border-2 border-background"
                                    title={user.name}
                                >
                                    <AvatarFallback className="text-[10px] font-medium">
                                        {getInitials(user.name)}
                                    </AvatarFallback>
                                </Avatar>
                            ))}

                            {overflowCount > 0 && (
                                <Avatar className="size-7 border-2 border-background">
                                    <AvatarFallback className="bg-foreground/80 text-[10px] font-medium text-background">
                                        +{overflowCount}
                                    </AvatarFallback>
                                </Avatar>
                            )}
                        </div>
                    )}
                </div>

                {canEdit && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(role)}
                        className="-mr-2 h-8 gap-1 font-medium"
                        data-test={`edit-role-${role.name}`}
                    >
                        Edit role
                        <ArrowRight className="size-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}
