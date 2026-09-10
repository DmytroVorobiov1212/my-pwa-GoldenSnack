export const MACHINES = [
  { key: 'butler', label: 'Butler', route: '/butler' },
  { key: 'velteko', label: 'Velteko', route: '/velteko' },
  { key: 'masek', label: 'Mašek', route: '/masek' },
];

export const MACHINE_ROUTES = MACHINES.reduce((routes, machine) => {
  routes[machine.key] = machine.route;
  return routes;
}, {});

export function getMachineName(machineKey) {
  const machine = MACHINES.find((item) => item.key === machineKey);
  return machine ? machine.label : '';
}

export function getDeviceMachineKeys(device) {
  if (device && Array.isArray(device.machineKeys) && device.machineKeys.length > 0) {
    return device.machineKeys.filter((machineKey) => Boolean(MACHINE_ROUTES[machineKey]));
  }

  return device && MACHINE_ROUTES[device.machineKey] ? [device.machineKey] : [];
}

export function getDeviceMachineNames(device) {
  return getDeviceMachineKeys(device)
    .map((machineKey) => getMachineName(machineKey))
    .filter(Boolean);
}
