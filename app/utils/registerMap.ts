// MIPS register name to number mapping
export const registerMap: { [key: string]: number } = {
  // Special registers
  '$zero': 0, '$0': 0,
  '$at': 1, '$1': 1,
  
  // Return values
  '$v0': 2, '$2': 2,
  '$v1': 3, '$3': 3,
  
  // Arguments
  '$a0': 4, '$4': 4,
  '$a1': 5, '$5': 5,
  '$a2': 6, '$6': 6,
  '$a3': 7, '$7': 7,
  
  // Temporaries
  '$t0': 8, '$8': 8,
  '$t1': 9, '$9': 9,
  '$t2': 10, '$10': 10,
  '$t3': 11, '$11': 11,
  '$t4': 12, '$12': 12,
  '$t5': 13, '$13': 13,
  '$t6': 14, '$14': 14,
  '$t7': 15, '$15': 15,
  
  // Saved temporaries
  '$s0': 16, '$16': 16,
  '$s1': 17, '$17': 17,
  '$s2': 18, '$18': 18,
  '$s3': 19, '$19': 19,
  '$s4': 20, '$20': 20,
  '$s5': 21, '$21': 21,
  '$s6': 22, '$22': 22,
  '$s7': 23, '$23': 23,
  
  // More temporaries
  '$t8': 24, '$24': 24,
  '$t9': 25, '$25': 25,
  
  // Kernel
  '$k0': 26, '$26': 26,
  '$k1': 27, '$27': 27,
  
  // Global pointer
  '$gp': 28, '$28': 28,
  
  // Stack pointer
  '$sp': 29, '$29': 29,
  
  // Frame pointer
  '$fp': 30, '$30': 30,
  
  // Return address
  '$ra': 31, '$31': 31,
};

export function registerNameToNumber(name: string): number {
  if (typeof name === 'number') return name;
  const num = registerMap[name.toLowerCase()];
  if (num === undefined) {
    throw new Error(`Unknown register: ${name}`);
  }
  return num;
}

export function registerNumberToName(num: number): string {
  const names: { [key: number]: string } = {
    0: '$zero', 1: '$at',
    2: '$v0', 3: '$v1',
    4: '$a0', 5: '$a1', 6: '$a2', 7: '$a3',
    8: '$t0', 9: '$t1', 10: '$t2', 11: '$t3',
    12: '$t4', 13: '$t5', 14: '$t6', 15: '$t7',
    16: '$s0', 17: '$s1', 18: '$s2', 19: '$s3',
    20: '$s4', 21: '$s5', 22: '$s6', 23: '$s7',
    24: '$t8', 25: '$t9',
    26: '$k0', 27: '$k1',
    28: '$gp', 29: '$sp', 30: '$fp', 31: '$ra',
  };
  return names[num] || `$${num}`;
}

