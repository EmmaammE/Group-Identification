/* eslint-disable import/prefer-default-export */
import * as d3 from 'd3';
import csv from '../assets/data/pppub20.csv';

async function handle() {
  const data = await d3.csv(csv);
  console.log(data.length);
}

export function processData() {
  handle();
  return csv.length;
}
