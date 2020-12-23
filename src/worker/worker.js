/* eslint-disable import/prefer-default-export */
import CPCA from '../assets/cpca.json';
import LABEL from '../assets/labels.json';

async function handle() {
  const datum = CPCA[0].map((d, i) => ({
    id: i,
    label: LABEL[i],
    PC1: d[0],
    PC2: d[1],
  }));

  return datum;
}

export function processData() {
  return handle();
}
