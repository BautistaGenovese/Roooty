import React from 'react';
import {
  Home,
  Split,
  Ruler,
  Activity,
  Target,
  MapPin,
  ScatterChart,
  Scale,
  AreaChart,
  Waves,
  Settings,
  History,
  Grid,
  Grid3x3,
  TrendingUp,
  Waypoints,
  Focus,
  Route
} from 'lucide-react';

const iconDefaults = {
  size: 20,
  strokeWidth: 1.75,
  className: "lucide-icon"
};

export const IconHome = (props) => <Home {...iconDefaults} {...props} />;
export const IconBiseccion = (props) => <Split {...iconDefaults} {...props} />;
export const IconRegulaFalsi = (props) => <Ruler {...iconDefaults} {...props} />;
export const IconNewton = (props) => <Activity {...iconDefaults} {...props} />;
export const IconSecante = (props) => <Target {...iconDefaults} {...props} />;
export const IconPuntoFijo = (props) => <MapPin {...iconDefaults} {...props} />;
export const IconRegresion = (props) => <ScatterChart {...iconDefaults} {...props} />;
export const IconComparacion = (props) => <Scale {...iconDefaults} {...props} />;
export const IconTrapecio = (props) => <AreaChart {...iconDefaults} {...props} />;
export const IconSimpson = (props) => <Waves {...iconDefaults} {...props} />;
export const IconSettings = (props) => <Settings {...iconDefaults} {...props} />;
export const IconHistory = (props) => <History {...iconDefaults} {...props} />;
// Gauss-Jordan (ours)
export const IconGaussJordan = (props) => <Grid {...iconDefaults} {...props} />;
// Eliminación Gaussiana (teammate)
export const IconMatrices = (props) => <Grid3x3 {...iconDefaults} {...props} />;
// EDOs
export const IconEuler = (props) => <TrendingUp {...iconDefaults} {...props} />;
export const IconHeun = (props) => <Waypoints {...iconDefaults} {...props} />;
export const IconPuntoMedio = (props) => <Focus {...iconDefaults} {...props} />;
export const IconRalston = (props) => <Route {...iconDefaults} {...props} />;
