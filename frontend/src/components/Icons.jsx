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
export const IconGaussJordan = (props) => <Grid {...iconDefaults} {...props} />;