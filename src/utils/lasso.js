/* eslint-disable func-names */
import * as d3 from 'd3';

// reference: https://observablehq.com/@fil/lasso-selection
function trackPointer(event, { start, move, out, end }) {
  const tracker = {};
  tracker.id = event.pointerId;
  const id = event.pointerId;
  const { target } = event;
  tracker.point = d3.pointer(event, target);
  target.setPointerCapture(id);

  d3.select(target)
    .on(`pointerup.${id} pointercancel.${id}`, (e) => {
      if (e.pointerId !== id) return;
      tracker.sourceEvent = e;
      d3.select(target).on(`.${id}`, null);
      target.releasePointerCapture(id);
      if (end) {
        end(tracker);
      }
    })
    .on(`pointermove.${id}`, (e) => {
      if (e.pointerId !== id) return;
      tracker.sourceEvent = e;
      tracker.prev = tracker.point;
      tracker.point = d3.pointer(e, target);
      if (move) {
        move(tracker);
      }
    })
    .on(`pointerout.${id}`, (e) => {
      if (e.pointerId !== id) return;
      tracker.sourceEvent = e;
      tracker.point = null;
      if (out) {
        out(tracker);
      }
    });

  if (start) {
    start(tracker);
  }
}

function lassoWrapper() {
  const dispatch = d3.dispatch('start', 'lasso', 'end');
  const lasso = function (selection) {
    const node = selection.node();
    const polygon = [];

    selection
      .on('touchmove', (e) => e.preventDefault()) // prevent scrolling
      .on('pointerdown', (e) => {
        trackPointer(e, {
          start: () => {
            polygon.length = 0;
            dispatch.call('start', node, polygon);
          },
          move: (p) => {
            polygon.push(p.point);
            dispatch.call('lasso', node, polygon);
          },
          end: () => {
            dispatch.call('end', node, polygon);
          },
        });
      });
  };
  // lasso.on = function(type, ...args) {
  //   if(args.length > 0) {
  //     return (dispatch.on(...args), lasso)
  //   }
  //   return dispatch.on(...args)
  // };
  lasso.on = function (type, _) {
    // eslint-disable-next-line prefer-rest-params
    return _ ? (dispatch.on(...arguments), lasso) : dispatch.on(...arguments);
  };

  return lasso;
}

export default lassoWrapper;
