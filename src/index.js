import DrawLineString from '@mapbox/mapbox-gl-draw/src/modes/draw_line_string';
import {geojsonTypes, cursors, types, updateActions, modes, events} from '@mapbox/mapbox-gl-draw/src/constants';
import simplify from "@turf/simplify";

const FreehandMode = Object.assign({}, DrawLineString)

FreehandMode.onSetup = function() {
    const line = this.newFeature({
        type: geojsonTypes.FEATURE,
        properties: {},
        geometry: {
            type: geojsonTypes.LINE_STRING,
            coordinates: [[]]
        }
    });

    this.addFeature(line);
    this.clearSelectedFeatures();

    // disable dragPan
    setTimeout(() => {
        if(!this.map || !this.map.dragPan) return;
        this.map.dragPan.disable();
    }, 0);

    this.updateUIClasses({ mouse: cursors.ADD });
    this.activateUIButton(types.LINE);
    this.setActionableState({
        trash: true
    });

    return {
        line,
        currentVertexPosition: 0,
        dragMoving: false
    };
};

FreehandMode.onDrag = FreehandMode.onTouchMove = function(state, e) {
    state.dragMoving = true;
    this.updateUIClasses({ mouse: cursors.ADD });
    state.line.updateCoordinate(`${state.currentVertexPosition}`, e.lngLat.lng, e.lngLat.lat);
    state.currentVertexPosition++;
    //state.line.updateCoordinate(`${state.currentVertexPosition}`, e.lngLat.lng, e.lngLat.lat);
}

FreehandMode.onMouseUp = function(state, e) {
    if(state.dragMoving) {
        this.simplify(state.line);
        this.fireUpdate();
        this.changeMode(modes.SIMPLE_SELECT, { featureIds: [state.line.id] });
    }
}

FreehandMode.onTouchEnd = function(state, e) {
    this.onMouseUp(state, e)
}

FreehandMode.fireUpdate = function() {
    this.map.fire(events.UPDATE, {
        action: updateActions.MOVE,
        features: this.getSelected().map(f => f.toGeoJSON())
    });
};

FreehandMode.simplify = function(line) {
  const tolerance = 1 / Math.pow(1.05, 10 * this.map.getZoom()) // https://www.desmos.com/calculator/nolp0g6pwr
  simplify(line, {
      mutate: true,
      tolerance: tolerance,
      highQuality: true
  });
}

FreehandMode.onStop = function (state) {
  DrawLineString.onStop.call(this, state)
  setTimeout(() => {
    if (!this.map || !this.map.dragPan) return;
    this.map.dragPan.enable();
  }, 0);
};
  
export default FreehandMode
