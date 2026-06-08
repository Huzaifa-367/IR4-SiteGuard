export type SiteOption = {
    id: number;
    name: string;
    code: string | null;
};

export type SiteContext = {
    selectedSite: SiteOption | null;
    sites: SiteOption[];
};
