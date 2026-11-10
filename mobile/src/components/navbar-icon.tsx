import Svg, { Path } from 'react-native-svg';

export type NavbarDestination = 'home' | 'projects' | 'camera' | 'settings' | 'profile';

// Solid silhouettes and transparent cutouts match the supplied navbar reference.
const paths: Record<NavbarDestination, string> = {
  home: 'M2.2 10.2 10.7 2.6a2 2 0 0 1 2.6 0l8.5 7.6a1.2 1.2 0 0 1-.8 2.1h-1v8a1.7 1.7 0 0 1-1.7 1.7H5.7A1.7 1.7 0 0 1 4 20.3v-8H3a1.2 1.2 0 0 1-.8-2.1ZM10 20h4v-4.5a2 2 0 0 0-4 0Z',
  projects: 'M3 4h5.1c.6 0 1.2.2 1.6.6L12 6h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V7a3 3 0 0 1 3-3Z',
  camera: 'M8.2 3h7.6a1.5 1.5 0 0 1 1.4 1l.8 2h3a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3l.8-2a1.5 1.5 0 0 1 1.4-1ZM12 10a4.3 4.3 0 1 0 0 8.6 4.3 4.3 0 0 0 0-8.6Z',
  settings: 'M19.43 12.98c.04-.32.07-.65.07-.98s-.03-.66-.08-.98l2.11-1.65a.5.5 0 0 0 .12-.64l-2-3.46a.5.5 0 0 0-.61-.22l-2.49 1a7.2 7.2 0 0 0-1.69-.98l-.38-2.65A.49.49 0 0 0 14 2h-4a.49.49 0 0 0-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1a.49.49 0 0 0-.61.22l-2 3.46a.49.49 0 0 0 .12.64l2.11 1.65c-.05.32-.09.66-.09.98s.03.66.08.98l-2.11 1.65a.5.5 0 0 0-.12.64l2 3.46c.12.22.38.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.04.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65a7.2 7.2 0 0 0 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46a.5.5 0 0 0-.12-.64l-2.1-1.65ZM12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z',
  profile: 'M12 1a5 5 0 1 1 0 10 5 5 0 0 1 0-10ZM3 21a9 9 0 0 1 18 0 1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z',
};

const viewBoxes: Record<NavbarDestination, string> = {
  home: '1 1 22 22',
  projects: '-0.5 1 23 23',
  camera: '0.5 1 23 23',
  settings: '2 2 20 20',
  profile: '1.5 0.5 21 22',
};

export default function NavbarIcon({ name, size = 24 }: { name: NavbarDestination; size?: number }) {
  return <Svg width={size} height={size} viewBox={viewBoxes[name]} aria-hidden focusable={false}>
    <Path d={paths[name]} fill="#FFFFFF" fillRule="evenodd" />
  </Svg>;
}
