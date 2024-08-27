
type AirportIndex = {
  [key:string]: {
    name: string,
    code: string,
    ports: Airport[]
  }
}

export type Airport = {
  name: string;
  code: string;
}

interface IAirportIndex {
  [key:string]: string
}

export const AirportNameIndex: IAirportIndex = {
  BHX: 'Birmingham',
  EMA: 'East Midlands',
  LCY: 'London City',
  SEN: 'London Southend',
  STN: 'London Stansted',
  LGW: 'London Gatwick',
  LTN: 'Luton',
  NWI: 'Norwich',
  ABZ: 'Aberdeen',
  BFS: 'Belfast International',
  BHD: 'Belfast City',
  EDI: 'Edinburgh',
  GLA: 'Glasgow',
  PIK: 'Glasgod Prestwick',
  HUY: 'Humberside',
  INV: 'Inverness',
  LBA: 'Leeds Bradford',
  LPL: 'Liverpool',
  MAN: 'Manchester',
  MME: 'Teeside International',
  NCL: 'Newcastle International',
  BOH: 'Bournemouth',
  CWL: 'Cardiff',
  EXT: 'Exeter',
  NQY: 'Newquay',
  SOU: 'Southampton',
  'LHR-T2': 'London Heathrow T2',
  'LHR-T3': 'London Heathrow T3',
  'LHR-T4': 'London Heathrow T4',
  'LHR-T5': 'London Heathrow T5',
}

export const getAirportByCode = (portCode: string): string => {
  let airportName: string = '';
  Object.keys(airports).map((regionKey: string) => {
    let region = airports[regionKey];
    // console.log(`Checking ${region.code} against ${portCode}`)
    if (region.code == portCode) {
      airportName = region.name;
    } else {
      region.ports.map((port) => {
        // console.log(`-- Checking port ${port.code} against ${portCode}`)
        if (port.code == portCode) {
          airportName = `${port.name} (${port.code})`
        }
      })
    }
  })
  return airportName || ''
}

const airports : AirportIndex = {
  'central': { 
    name: 'Central region',
    code: 'central',
    ports: [
      { name: 'Birmingham', code: 'BHX'},
      { name: 'East Midlands', code: 'EMA'},
      { name: 'London City', code: 'LCY'},
      { name: 'London Southend', code: 'SEN'},
      { name: 'London Stansted', code: 'STN'},
      { name: 'Luton', code: 'LTN'},
      { name: 'Norwich', code: 'NWI'},
    ]
  },
  'north': { 
    name: 'North region',
    code: 'north',
    ports:  [
      { name: 'Aberdeen', code: 'ABZ'},
      { name: 'Belfast International', code: 'BFS'},
      { name: 'Belfast City', code: 'BHD'},
      { name: 'Edinburgh', code: 'EDI'},
      { name: 'Glasgow', code: 'GLA'},
      { name: 'Glasgow Prestwick', code: 'PIK'},
      { name: 'Humberside', code: 'HUY'},
      { name: 'Inverness', code: 'INV'},
      { name: 'Leeds Bradford', code: 'LBA'},
      { name: 'Liverpool', code: 'LPL'},
      { name: 'Manchester', code: 'MAN'},
      { name: 'Teeside International', code: 'MME'},
      { name: 'Newcastle International', code: 'NCL'},
    ],
  },
  'south': { 
    name: 'South region',
    code: 'south',
    ports:  [
      { name: 'Bournemouth', code: 'BOH'},
      { name: 'Bristol', code: 'BRS'},
      { name: 'Cardiff', code: 'CWL'},
      { name: 'Exeter', code: 'EXT'},
      { name: 'London Gatwick', code: 'LGW'},
      { name: 'Newquay', code: 'NQY'},
      { name: 'Southampton', code: 'SOU'},
    ]
  },
  'heathrow': {
    name: 'Heathrow',
    code: 'heathrow',
    ports: [
      { name: 'Heathrow T2', code: 'LHR-T2'},
      { name: 'Heathrow T3', code: 'LHR-T3'},
      { name: 'Heathrow T4', code: 'LHR-T4'},
      { name: 'Heathrow T5', code: 'LHR-T5'},
    ]
  },
} 

export default airports;
