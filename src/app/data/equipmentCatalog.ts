import { Equipment } from '../types';

function equipment(
  id: string,
  name: string,
  brand: string,
  category: Equipment['category'],
  program: string,
  image: string,
): Equipment {
  return {
    id,
    name,
    brand,
    category,
    program,
    qrcode: `${id}-QR-2026`,
    photoUrl: `/equipment/${encodeURIComponent(image.replace(/\.png$/i, '.jpg'))}`,
    totalStock: 10,
    availableStock: 10,
    borrowedStock: 0,
    status: 'Available',
    qualityCondition: 'Excellent',
    lastConditionUpdate: '2026-09-26',
  };
}

const culinary = 'Culinary';
const hospitality = 'Hospitality';
const aviation = 'Aviation Maintenance';
const science = 'Science/Health-related';

export const INITIAL_EQUIPMENT: Equipment[] = [
  equipment('CUL-001', 'Doom Kitchen Measuring Spoons Set', 'Doom', culinary, 'BS Culinary', 'Doom Kitchen Measuring Spoons Set.png'),
  equipment('CUL-002', 'Hawch Electronic Balance', 'Hawch', culinary, 'BS Culinary', 'Hawch Electronic Balance.png'),
  equipment('CUL-003', 'WCC Expresso Grinders', 'WCC', culinary, 'BS Culinary', 'WCC Expresso Grinders.png'),
  equipment('CUL-004', 'WCC Expresso Machine', 'WCC', culinary, 'BS Culinary', 'WCC Expresso Machine.png'),
  equipment('CUL-005', 'WCC First Aid Kit Set', 'WCC', culinary, 'BS Culinary', 'WCC First Aid Kit Set.png'),
  equipment('CUL-006', 'WCC Kitchen Knives Set', 'WCC', culinary, 'BS Culinary', 'WCC Kitchen Knives Set.png'),
  equipment('CUL-007', 'WCC Kitchen Preparation Tools Set', 'WCC', culinary, 'BS Culinary', 'WCC Kitchen Preparation Tools Set.png'),
  equipment('CUL-008', 'WCC Pans and Cookware Set', 'WCC', culinary, 'BS Culinary', 'WCC Pans and Cookware Set.png'),
  equipment('CUL-009', 'WCC Strainer Set', 'WCC', culinary, 'BS Culinary', 'WCC Strainer Set.png'),
  equipment('CUL-010', 'WCC Water Filter', 'WCC', culinary, 'BS Culinary', 'WCC Water Filter.png'),

  equipment('HOS-001', 'Hawch Electronic Balance', 'Hawch', hospitality, 'BS Hospitality Management', 'Hawch Electronic Balance.png'),
  equipment('HOS-002', 'WCC Cleaning Products', 'WCC', hospitality, 'BS Hospitality Management', 'WCC Cleaning Products.png'),
  equipment('HOS-003', 'WCC Expresso Grinders', 'WCC', hospitality, 'BS Hospitality Management', 'WCC Expresso Grinders.png'),
  equipment('HOS-004', 'WCC Expresso Machine', 'WCC', hospitality, 'BS Hospitality Management', 'WCC Expresso Machine.png'),
  equipment('HOS-005', 'WCC First Aid Kit Set', 'WCC', hospitality, 'BS Hospitality Management', 'WCC First Aid Kit Set.png'),
  equipment('HOS-006', 'WCC Kitchen Knives Set', 'WCC', hospitality, 'BS Hospitality Management', 'WCC Kitchen Knives Set.png'),
  equipment('HOS-007', 'WCC Kitchen Preparation Tools Set', 'WCC', hospitality, 'BS Hospitality Management', 'WCC Kitchen Preparation Tools Set.png'),
  equipment('HOS-008', 'WCC Pans and Cookware Set', 'WCC', hospitality, 'BS Hospitality Management', 'WCC Pans and Cookware Set.png'),
  equipment('HOS-009', 'WCC Strainer Set', 'WCC', hospitality, 'BS Hospitality Management', 'WCC Strainer Set.png'),
  equipment('HOS-010', 'WCC Water Filter', 'WCC', hospitality, 'BS Hospitality Management', 'WCC Water Filter.png'),

  equipment('AVI-001', 'Tolsen Screw Driver Set', 'Tolsen', aviation, 'BS Aviation', 'Tolsen Screw Driver Set.png'),
  equipment('AVI-002', 'WCC Aviation Headset', 'WCC', aviation, 'BS Aviation', 'WCC Aviation Headset.png'),
  equipment('AVI-003', 'WCC E6B Flight Computer', 'WCC', aviation, 'BS Aviation', 'WCC E6B Flight Computer.png'),
  equipment('AVI-004', 'WCC First Aid Kit Set', 'WCC', aviation, 'BS Aviation', 'WCC First Aid Kit Set.png'),
  equipment('AVI-005', 'WCC Pilot Kneeboard', 'WCC', aviation, 'BS Aviation', 'WCC Pilot Kneeboard.png'),
  equipment('AVI-006', 'WCC Plotter', 'WCC', aviation, 'BS Aviation', 'WCC Plotter.png'),
  equipment('AVI-007', 'WCC Riveting Hand Tools Set', 'WCC', aviation, 'BS Aviation', 'WCC Riveting Hand Tools set.png'),
  equipment('AVI-008', 'WCC Safety Wire Pliers', 'WCC', aviation, 'BS Aviation', 'WCC Safety Wire Pliers.png'),
  equipment('AVI-009', 'WCC Aviation Penlight', 'WCC', aviation, 'BS Aviation', 'WCC Aviation Penlight.png'),
  equipment('AVI-010', 'WCC Aviation Snips', 'WCC', aviation, 'BS Aviation', 'WCC Aviation Snips.png'),
  equipment('AVI-011', 'WCC Digital Multimeter', 'WCC', aviation, 'BS Aviation', 'WCC Digital Multimeter.jpg'),
  equipment('AVI-012', 'WCC Drive Socket & Wrench Set', 'WCC', aviation, 'BS Aviation', 'WCC Drive Socket and Wrench Set.jpg'),
  equipment('AVI-013', 'WCC Mechanical Precision Hand Tools Set', 'WCC', aviation, 'BS Aviation', 'WCC Mechanical Precision Hand Tools Set.png'),

  equipment('SCI-001', 'WCC Microscope', 'WCC', science, 'BS General Science', 'WCC Micsroscope.png'),
];

export const INVENTORY_VERSION = 7;
