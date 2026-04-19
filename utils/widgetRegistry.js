
import CommuterWidget from '@/components/widgets/commuter';
import DateWidget from '@/components/widgets/date';
import EnergyPriceWidget from '@/components/widgets/el';
import MusicWidget from '@/components/widgets/music';
import PrecipitationWidget from '@/components/widgets/rain';
import UVWidget from '@/components/widgets/uv';
import WeatherWidget from '@/components/widgets/weather';
import YearProgressWidget from '@/components/widgets/year';

export const WIDGET_REGISTRY = {
  'commuter': CommuterWidget,
  'date': DateWidget,
  'el': EnergyPriceWidget,
  'music': MusicWidget,
  'rain': PrecipitationWidget,
  'uv': UVWidget,
  'weather': WeatherWidget,
  'year': YearProgressWidget
};

export const WIDGET_METADATA = {
  'commuter': { name: 'Commuter', description: 'Morning/evening transit info' },
  'date': { name: 'Date', description: 'Current date display' },
  'el': { name: 'El', description: 'Current electricity price in SE3' },
  'music': { name: 'Music', description: 'AirPlay music player' },
  'rain': { name: 'Rain Alert', description: 'Shows when rain expected soon' },
  'uv': { name: 'UV Index', description: 'Shows when UV index > 4' },
  'weather': { name: 'Weather', description: 'Current weather conditions' },
  'year': { name: 'Year', description: 'Description for year widget' }
};