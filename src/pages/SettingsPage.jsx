import React, { useState, useEffect } from 'react';
import { fetchLocations, addLocation, updateLocation, deleteLocation } from '../services/LocationService';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { MapPin, ChevronDown, Plus, Edit, Trash2, Sun, Moon, Monitor, Palette } from 'lucide-react';

// A reusable component for each setting section
const SettingsSection = ({ title, icon, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-5 text-left"
            >
                <div className="flex items-center">
                    {icon}
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white">{title}</h2>
                </div>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
                    <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </motion.div>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-5 border-t border-gray-200 dark:border-gray-700">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Component for managing locations
const LocationManager = () => {
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({ Latitude: '', Longitude: '' });
    const [editingLocationId, setEditingLocationId] = useState(null);

    useEffect(() => {
        const loadLocations = async () => {
            try {
                setLoading(true);
                const locationResponse = await fetchLocations();
                setLocations(locationResponse || []);
            } catch (err) {
                setError('Failed to fetch locations: ' + err.message);
            } finally {
                setLoading(false);
            }
        };
        loadLocations();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleGetLocation = () => {
        toast.loading('Fetching current location...');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                toast.dismiss();
                toast.success('Location fetched!');
                setFormData({
                    Latitude: position.coords.latitude.toFixed(6),
                    Longitude: position.coords.longitude.toFixed(6),
                });
            },
            (err) => {
                toast.dismiss();
                toast.error(`Error: ${err.message}`);
            }
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const toastId = toast.loading(editingLocationId ? 'Updating...' : 'Adding...');
        try {
            const locationData = {
                Latitude: parseFloat(formData.Latitude),
                Longitude: parseFloat(formData.Longitude),
            };

            if (editingLocationId) {
                const updated = await updateLocation(editingLocationId, locationData);
                setLocations(prev => prev.map(loc => loc.$id === editingLocationId ? updated : loc));
                toast.success('Location updated!', { id: toastId });
            } else {
                const newLocation = await addLocation(locationData);
                setLocations(prev => [newLocation, ...prev]);
                toast.success('Location added!', { id: toastId });
            }
            setFormData({ Latitude: '', Longitude: '' });
            setEditingLocationId(null);
        } catch (err) {
            toast.error(err.message, { id: toastId });
        }
    };
    
    const handleEdit = (location) => {
        setEditingLocationId(location.$id);
        setFormData({
            Latitude: location.Latitude.toString(),
            Longitude: location.Longitude.toString(),
        });
    };

    const handleCancelEdit = () => {
        setEditingLocationId(null);
        setFormData({ Latitude: '', Longitude: '' });
    };

    const handleDelete = async (locationId) => {
        if (window.confirm('Are you sure you want to delete this location?')) {
            const toastId = toast.loading('Deleting...');
            try {
                await deleteLocation(locationId);
                setLocations(prev => prev.filter(loc => loc.$id !== locationId));
                toast.success('Location deleted.', { id: toastId });
            } catch (err) {
                toast.error(err.message, { id: toastId });
            }
        }
    };

    if (loading) return <div className="flex justify-center items-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div></div>;
    if (error) return <div className="p-4 text-red-600 bg-red-100 dark:bg-red-900/30 rounded-lg">{error}</div>;

    return (
        <div className="space-y-6">
            <form onSubmit={handleSubmit} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-4">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300">{editingLocationId ? 'Edit Location' : 'Add New Location'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="number" step="any" name="Latitude" placeholder="Latitude" value={formData.Latitude} onChange={handleInputChange} className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg" required />
                    <input type="number" step="any" name="Longitude" placeholder="Longitude" value={formData.Longitude} onChange={handleInputChange} className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg" required />
                </div>
                <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={handleGetLocation} className="flex-grow text-sm bg-blue-100 text-blue-700 font-semibold py-2 px-4 rounded-lg hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900 transition-colors">Get Current Location</button>
                    <button type="submit" className="flex-grow flex items-center justify-center bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"><Plus className="w-5 h-5 mr-2" />{editingLocationId ? 'Update' : 'Add'}</button>
                    {editingLocationId && <button type="button" onClick={handleCancelEdit} className="flex-grow bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>}
                </div>
            </form>

            <div className="space-y-3">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300">Saved Locations</h3>
                {locations.length > 0 ? locations.map(location => (
                    <div key={location.$id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                        <p className="text-sm font-mono">{`Lat: ${location.Latitude}, Lon: ${location.Longitude}`}</p>
                        <div className="flex gap-2">
                            <button onClick={() => handleEdit(location)} className="p-1 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400"><Edit className="w-4 h-4" /></button>
                            <button onClick={() => handleDelete(location.$id)} className="p-1 text-gray-500 hover:text-red-600 dark:hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    </div>
                )) : <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No locations saved yet.</p>}
            </div>
        </div>
    );
};

// Component for managing appearance
const AppearanceSettings = () => {
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'system');

    // This effect listens for system theme changes to update the UI in real-time
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            // Only update if the user has selected "system"
            if (!localStorage.getItem('theme')) {
                document.documentElement.classList.toggle('dark', mediaQuery.matches);
            }
        };
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    const handleThemeChange = (newTheme) => {
        setTheme(newTheme);
        const root = document.documentElement;
        if (newTheme === 'system') {
            localStorage.removeItem('theme');
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            root.classList.toggle('dark', isDark);
        } else {
            localStorage.setItem('theme', newTheme);
            root.classList.toggle('dark', newTheme === 'dark');
        }
    };

    const ThemeButton = ({ mode, icon, label }) => (
        <button
            onClick={() => handleThemeChange(mode)}
            className={`w-full p-4 rounded-lg border-2 transition-colors text-center ${
                theme === mode ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400'
            }`}
        >
            {icon}
            <span className="font-semibold mt-2 block">{label}</span>
        </button>
    );

    return (
        <div>
            <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-4">Theme</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <ThemeButton mode="light" icon={<Sun className="w-8 h-8 mx-auto text-yellow-500" />} label="Light" />
                <ThemeButton mode="dark" icon={<Moon className="w-8 h-8 mx-auto text-indigo-400" />} label="Dark" />
                <ThemeButton mode="system" icon={<Monitor className="w-8 h-8 mx-auto text-gray-500" />} label="System" />
            </div>
        </div>
    );
};

function SettingsPage() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ className: 'dark:bg-gray-700 dark:text-white' }} />
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Manage your application settings and preferences.</p>
          <div className="space-y-6">
            <SettingsSection title="Appearance" icon={<Palette className="w-6 h-6 mr-3 text-indigo-600" />} defaultOpen={true}>
                <AppearanceSettings />
            </SettingsSection>
            <SettingsSection title="Location Management" icon={<MapPin className="w-6 h-6 mr-3 text-indigo-600" />}>
                <LocationManager />
            </SettingsSection>
          </div>
        </div>
      </div>
    </>
  );
}

export default SettingsPage;
