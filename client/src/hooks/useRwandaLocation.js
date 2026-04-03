import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchCells,
  fetchDistricts,
  fetchProvinces,
  fetchSectors,
  fetchVillages,
} from '../lib/registrationApi';

const EMPTY_OPTIONS = {
  provinces: [],
  districts: [],
  sectors: [],
  cells: [],
  villages: [],
};

const EMPTY_CATALOG = {
  sectors: true,
  cells: true,
  villages: true,
};

function resetChildren(location, field) {
  if (field === 'province') {
    return { ...location, district: '', sector: '', cell: '', village: '' };
  }
  if (field === 'district') {
    return { ...location, sector: '', cell: '', village: '' };
  }
  if (field === 'sector') {
    return { ...location, cell: '', village: '' };
  }
  if (field === 'cell') {
    return { ...location, village: '' };
  }
  return location;
}

export function useRwandaLocation(initialLocation = {}, source = 'hybrid') {
  const [location, setLocation] = useState({
    country: initialLocation.country ?? 'Rwanda',
    province: initialLocation.province ?? '',
    district: initialLocation.district ?? '',
    sector: initialLocation.sector ?? '',
    cell: initialLocation.cell ?? '',
    village: initialLocation.village ?? '',
  });

  const [options, setOptions] = useState(EMPTY_OPTIONS);
  const [catalogAvailable, setCatalogAvailable] = useState(EMPTY_CATALOG);
  const [loading, setLoading] = useState({
    provinces: false,
    districts: false,
    sectors: false,
    cells: false,
    villages: false,
  });

  useEffect(() => {
    let isActive = true;
    setLoading((current) => ({ ...current, provinces: true }));

    fetchProvinces(source)
      .then((payload) => {
        if (isActive) {
          setOptions((current) => ({ ...current, provinces: payload.items }));
        }
      })
      .finally(() => {
        if (isActive) {
          setLoading((current) => ({ ...current, provinces: false }));
        }
      });

    return () => {
      isActive = false;
    };
  }, [source]);

  useEffect(() => {
    if (!location.province) {
      setOptions((current) => ({
        ...current,
        districts: [],
        sectors: [],
        cells: [],
        villages: [],
      }));
      return;
    }

    let isActive = true;
    setLoading((current) => ({ ...current, districts: true }));

    fetchDistricts(location.province, source)
      .then((payload) => {
        if (isActive) {
          setOptions((current) => ({
            ...current,
            districts: payload.items,
            sectors: [],
            cells: [],
            villages: [],
          }));
        }
      })
      .catch(() => {
        if (isActive) {
          setOptions((current) => ({ ...current, districts: [] }));
        }
      })
      .finally(() => {
        if (isActive) {
          setLoading((current) => ({ ...current, districts: false }));
        }
      });

    return () => {
      isActive = false;
    };
  }, [location.province, source]);

  useEffect(() => {
    if (!location.province || !location.district) {
      setOptions((current) => ({ ...current, sectors: [], cells: [], villages: [] }));
      return;
    }

    let isActive = true;
    setLoading((current) => ({ ...current, sectors: true }));

    fetchSectors({ province: location.province, district: location.district, source })
      .then((payload) => {
        if (isActive) {
          setOptions((current) => ({ ...current, sectors: payload.items, cells: [], villages: [] }));
          setCatalogAvailable((current) => ({
            ...current,
            sectors: payload.catalogAvailable !== false,
          }));
        }
      })
      .catch(() => {
        if (isActive) {
          setOptions((current) => ({ ...current, sectors: [] }));
          setCatalogAvailable((current) => ({ ...current, sectors: false }));
        }
      })
      .finally(() => {
        if (isActive) {
          setLoading((current) => ({ ...current, sectors: false }));
        }
      });

    return () => {
      isActive = false;
    };
  }, [location.province, location.district, source]);

  useEffect(() => {
    if (!location.province || !location.district || !location.sector) {
      setOptions((current) => ({ ...current, cells: [], villages: [] }));
      return;
    }

    let isActive = true;
    setLoading((current) => ({ ...current, cells: true }));

    fetchCells({
      province: location.province,
      district: location.district,
      sector: location.sector,
      source,
    })
      .then((payload) => {
        if (isActive) {
          setOptions((current) => ({ ...current, cells: payload.items, villages: [] }));
          setCatalogAvailable((current) => ({
            ...current,
            cells: payload.catalogAvailable !== false,
          }));
        }
      })
      .catch(() => {
        if (isActive) {
          setOptions((current) => ({ ...current, cells: [] }));
          setCatalogAvailable((current) => ({ ...current, cells: false }));
        }
      })
      .finally(() => {
        if (isActive) {
          setLoading((current) => ({ ...current, cells: false }));
        }
      });

    return () => {
      isActive = false;
    };
  }, [location.province, location.district, location.sector, source]);

  useEffect(() => {
    if (!location.province || !location.district || !location.sector || !location.cell) {
      setOptions((current) => ({ ...current, villages: [] }));
      return;
    }

    let isActive = true;
    setLoading((current) => ({ ...current, villages: true }));

    fetchVillages({
      province: location.province,
      district: location.district,
      sector: location.sector,
      cell: location.cell,
      source,
    })
      .then((payload) => {
        if (isActive) {
          setOptions((current) => ({ ...current, villages: payload.items }));
          setCatalogAvailable((current) => ({
            ...current,
            villages: payload.catalogAvailable !== false,
          }));
        }
      })
      .catch(() => {
        if (isActive) {
          setOptions((current) => ({ ...current, villages: [] }));
          setCatalogAvailable((current) => ({ ...current, villages: false }));
        }
      })
      .finally(() => {
        if (isActive) {
          setLoading((current) => ({ ...current, villages: false }));
        }
      });

    return () => {
      isActive = false;
    };
  }, [location.province, location.district, location.sector, location.cell, source]);

  const updateLocation = useCallback((field, value) => {
    setLocation((current) => resetChildren({ ...current, [field]: value }, field));
  }, []);

  const flatLocation = useMemo(() => ({ ...location }), [location]);

  return {
    location: flatLocation,
    updateLocation,
    options,
    loading,
    catalogAvailable,
  };
}
