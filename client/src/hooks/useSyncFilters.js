import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function useSyncFilters(initialFilters) {
    const [searchParams, setSearchParams] = useSearchParams();
        const [filters, setFilters] = useState(() => ({
            ...initialFilters,
            ...Object.fromEntries(searchParams)
        }));

        const updateFilters = (newFilters) => {
            setFilters(newFilters);
            setSearchParams(newFilters);
        };

    return [filters, updateFilters];
}
