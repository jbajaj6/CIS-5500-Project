// src/components/FilterPanel.jsx
import { useState, useEffect } from 'react';
import config from '../config';
import { safeFetch } from '../utils';
import {
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Button,
    Box,
    Paper,
    Typography
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#00f2fe',
        },
        background: {
            paper: '#1e213a',
        },
    },
});

export default function FilterPanel({ onFilterChange, filters = {} }) {
    const [states, setStates] = useState([]);
    const [diseases, setDiseases] = useState([]);
    const [demographics, setDemographics] = useState({ races: [], sexes: [], ageGroups: [] });
    const [loading, setLoading] = useState(true);

    // Local state for filter values
    const [selectedState, setSelectedState] = useState(filters.state || '');
    const [selectedDisease, setSelectedDisease] = useState(filters.disease || '');
    const [selectedYear, setSelectedYear] = useState(filters.year || 2025);
    const [selectedWeek, setSelectedWeek] = useState(filters.week || 1);
    const [selectedRace, setSelectedRace] = useState(filters.race || '');
    const [selectedSex, setSelectedSex] = useState(filters.sex || '');
    const [selectedAgeGroup, setSelectedAgeGroup] = useState(filters.ageGroup || '');

    useEffect(() => {
        loadFilterOptions();
    }, []);

    const loadFilterOptions = async () => {
        try {
            const [statesData, diseasesData, demographicsData] = await Promise.all([
                safeFetch(`${config.apiBaseUrl}/api/states`),
                safeFetch(`${config.apiBaseUrl}/api/diseases`),
                safeFetch(`${config.apiBaseUrl}/api/demographic-options`),
            ]);

            setStates(statesData);
            setDiseases(diseasesData);
            setDemographics(demographicsData);
        } catch (error) {
            console.error('Error loading filter options:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApplyFilters = () => {
        onFilterChange({
            state: selectedState,
            disease: selectedDisease,
            year: selectedYear,
            week: selectedWeek,
            race: selectedRace,
            sex: selectedSex,
            ageGroup: selectedAgeGroup,
        });
    };

    if (loading) {
        return (
            <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                <div className="pulse">Loading filters...</div>
            </div>
        );
    }

    return (
        <ThemeProvider theme={darkTheme}>
            <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 2, background: 'rgba(30, 33, 58, 0.8)', backdropFilter: 'blur(10px)' }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'white', mb: 2 }}>
                    Filters
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                    {filters.showYear !== false && (
                        <FormControl fullWidth size="small">
                            <InputLabel>Year</InputLabel>
                            <Select
                                value={selectedYear}
                                label="Year"
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                            >
                                {Array.from({ length: 6 }, (_, i) => 2020 + i).map(year => (
                                    <MenuItem key={year} value={year}>{year}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}

                    {filters.showWeek && (
                        <TextField
                            label="Week"
                            type="number"
                            size="small"
                            InputProps={{ inputProps: { min: 1, max: 52 } }}
                            value={selectedWeek}
                            onChange={(e) => setSelectedWeek(Number(e.target.value))}
                            fullWidth
                        />
                    )}

                    {filters.showState !== false && (
                        <FormControl fullWidth size="small">
                            <InputLabel>State</InputLabel>
                            <Select
                                value={selectedState}
                                label="State"
                                onChange={(e) => setSelectedState(e.target.value)}
                            >
                                <MenuItem value=""><em>All States</em></MenuItem>
                                {states.map(state => (
                                    <MenuItem key={state.stateCode} value={state.stateName}>
                                        {state.stateName}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}

                    {filters.showDisease !== false && (
                        <FormControl fullWidth size="small">
                            <InputLabel>Disease</InputLabel>
                            <Select
                                value={selectedDisease}
                                label="Disease"
                                onChange={(e) => setSelectedDisease(e.target.value)}
                            >
                                <MenuItem value=""><em>Select Disease</em></MenuItem>
                                {diseases.map(disease => (
                                    <MenuItem key={disease.diseaseId} value={disease.diseaseName}>
                                        {disease.diseaseName}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}

                    {filters.showRace && (
                        <FormControl fullWidth size="small">
                            <InputLabel>Race</InputLabel>
                            <Select
                                value={selectedRace}
                                label="Race"
                                onChange={(e) => setSelectedRace(e.target.value)}
                            >
                                <MenuItem value=""><em>Select Race</em></MenuItem>
                                {demographics.races.map(race => (
                                    <MenuItem key={race} value={race}>{race}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}

                    {filters.showSex && (
                        <FormControl fullWidth size="small">
                            <InputLabel>Sex</InputLabel>
                            <Select
                                value={selectedSex}
                                label="Sex"
                                onChange={(e) => setSelectedSex(e.target.value)}
                            >
                                <MenuItem value=""><em>Select Sex</em></MenuItem>
                                {demographics.sexes.map(sex => (
                                    <MenuItem key={sex} value={sex}>{sex}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}

                    {filters.showAgeGroup && (
                        <FormControl fullWidth size="small">
                            <InputLabel>Age Group</InputLabel>
                            <Select
                                value={selectedAgeGroup}
                                label="Age Group"
                                onChange={(e) => setSelectedAgeGroup(e.target.value)}
                            >
                                <MenuItem value=""><em>Select Age Group</em></MenuItem>
                                {demographics.ageGroups.map(age => (
                                    <MenuItem key={age} value={age}>{age}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                </Box>

                <Box sx={{ mt: 3 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleApplyFilters}
                        sx={{ px: 4, py: 1, fontWeight: 'bold' }}
                    >
                        Apply Filters
                    </Button>
                </Box>
            </Paper>
        </ThemeProvider>
    );
}
