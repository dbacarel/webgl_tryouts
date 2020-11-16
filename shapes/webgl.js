const canvasElement = document.getElementById('canvas');
const gl = canvasElement.getContext('webgl');
const framesCounterElement = document.createElement('div');
let framesCounter = 0;
let shape_;
let program_;
let currentShapeVertices_, vertexCount_;
let vertexBuffer_, a_Position;
const LINE_WIDTH = 0.01;
const geometries = {
	'point': [],
	'hline': [],
	'vline': [],
	'triangle': [],
	'square': [],
};

const VERTEX_SHADER = `
attribute vec4 a_Position;
void main() {
  gl_Position = a_Position;
  gl_PointSize = 5.;
}
`;
const FRAGMENT_SHADER = `
void main() {
  gl_FragColor = vec4(.4, 0., 0., 1.);
}
`;

const setupProgram = () => {
	const vertex_shader = gl.createShader(gl.VERTEX_SHADER);
	const fragment_shader = gl.createShader(gl.FRAGMENT_SHADER);
	
	gl.shaderSource(vertex_shader, VERTEX_SHADER);
	gl.shaderSource(fragment_shader, FRAGMENT_SHADER);
	
	gl.compileShader(vertex_shader);
	gl.compileShader(fragment_shader);
	
	program_ = gl.createProgram();
	
	gl.attachShader(program_, vertex_shader);
	gl.attachShader(program_, fragment_shader);
	
	gl.linkProgram(program_);

	
	if (!gl.getProgramParameter(program_, gl.LINK_STATUS) ) {
	 var info = gl.getProgramInfoLog(program_);
	 throw 'Could not compile WebGL program. \n\n' + info;
	}
	
	gl.useProgram(program_);

	a_Size = gl.getAttribLocation(program_, 'a_size');
	
}


const renderLoop = () => {
	render();
	requestAnimationFrame(renderLoop);
}


const render = () => {
	// gl.clearColor(1.0, 0., 0.32, .35);
	gl.clearColor(0, 0, 0, .05);
	gl.clear(gl.COLOR_BUFFER_BIT);

	framesCounterElement.innerHTML = '#Frames: ' + framesCounter++;

	let mode;
	
	let offset = 0;
	let nVertex = 0;
	for (let geometry in geometries) {
		switch(geometry) {
			case 'point':
				mode = gl.POINTS;
				nVertex = 1
				break;
			case 'hline':
				mode = gl.TRIANGLE_FAN;
				nVertex = 4;
				break;
			case 'vline':
				mode = gl.TRIANGLE_FAN;
				nVertex = 4;
				break;
			case 'triangle':
				mode = gl.TRIANGLES;
				nVertex = 3
				break;
			case 'square':
				mode = gl.TRIANGLE_FAN;
				nVertex = 4;
				break;
			
		}

		
		geometries[geometry].forEach(() => {
			// Assign the buffer object to a_Position
			gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 8, offset);
			// Link a_Position to buffer object
			gl.enableVertexAttribArray(a_Position);
			gl.drawArrays(mode, 0, nVertex);
			offset += 8 * nVertex;
		})
	}
};
	
	

/**
 * To return the coordinates in model-space of the pointer
 * @param {*} evt 
 */
function getModelSpaceCoords(evt) {
	const x = evt.clientX;
	const y = evt.clientY;
	const bound = evt.target.getBoundingClientRect();
	
	const coordX = ((x - bound.left) - canvasElement.width / 2) / (canvasElement.width / 2);
	const coordY = (canvasElement.height / 2 - (y - bound.top)) / (canvasElement.height / 2);
	return {x: coordX, y:coordY};
};


/**
 * To return the coordinates of the vertices of the given shape
 * @param {object} centerCoors an object containing the x/y coordinates of the point in model space
 * @param {string} shape the shape to draw
 */
function getVertices(centerCoors, shape) {
	const SHAPE_MAGNITUDE = 0.3;
	let coords,
		vertexCount;
	switch(shape) {
		case 'point':
			coords = [centerCoors.x, centerCoors.y];
			vertexCount = 1;
			break;
		case 'hline':
			coords = [
				centerCoors.x - SHAPE_MAGNITUDE, centerCoors.y - LINE_WIDTH / 2,
				centerCoors.x + SHAPE_MAGNITUDE, centerCoors.y - LINE_WIDTH / 2,
				centerCoors.x + SHAPE_MAGNITUDE, centerCoors.y + LINE_WIDTH / 2,
				centerCoors.x - SHAPE_MAGNITUDE, centerCoors.y + LINE_WIDTH / 2,
			];
			vertexCount = 4;
			break;
		case 'vline':
			coords = [
				centerCoors.x - LINE_WIDTH / 2, centerCoors.y - SHAPE_MAGNITUDE,
				centerCoors.x + LINE_WIDTH / 2, centerCoors.y - SHAPE_MAGNITUDE,
				centerCoors.x + LINE_WIDTH / 2, centerCoors.y + SHAPE_MAGNITUDE,
				centerCoors.x - LINE_WIDTH / 2, centerCoors.y + SHAPE_MAGNITUDE,
			];
			vertexCount = 4;
			break;
		case 'triangle':
			coords = [
				centerCoors.x, centerCoors.y + SHAPE_MAGNITUDE, // first vertex on top
				centerCoors.x - SHAPE_MAGNITUDE, centerCoors.y - SHAPE_MAGNITUDE, // third vertex on bottom-left
				centerCoors.x + SHAPE_MAGNITUDE, centerCoors.y - SHAPE_MAGNITUDE, // second vertex on bottom-right
			];
			vertexCount = 3;
			break;
		case 'square':
			coords = [
				centerCoors.x - SHAPE_MAGNITUDE / 2, centerCoors.y - SHAPE_MAGNITUDE / 2,
				centerCoors.x + SHAPE_MAGNITUDE / 2, centerCoors.y - SHAPE_MAGNITUDE / 2,
				centerCoors.x + SHAPE_MAGNITUDE / 2, centerCoors.y + SHAPE_MAGNITUDE / 2, 
				centerCoors.x - SHAPE_MAGNITUDE / 2, centerCoors.y + SHAPE_MAGNITUDE / 2                                                                   
			];
			vertexCount = 4;
			break;
		
	}
	return {vertexCoords: new Float32Array(coords), vertexCount};
}

function updatePosition(evt) {
	const modelSpaceCenter = getModelSpaceCoords(evt);
	const vertices = getVertices(modelSpaceCenter, shape_);
	currentShapeVertices_ = vertices.vertexCoords;
	vertexCount_ = vertices.vertexCount;
}

function drawShape() {
	
	geometries[shape_].push(currentShapeVertices_);


	if (!vertexBuffer_) {
		// Create buffer
		vertexBuffer_ = gl.createBuffer();
		if (!vertexBuffer_) {
			console.log('Failed to create buffer object');
		}
		// Bind buffer to target
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer_);
		a_Position = gl.getAttribLocation(program_, 'a_Position');


	}

	buff_vertices = new Array();
	
	for (let geometry in geometries) {
		geometries[geometry].forEach(geom_vertices => {
			geom_vertices.forEach(e=> buff_vertices.push(e));
		});
	}
	if (buff_vertices.length) {
		// Write data
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(buff_vertices), gl.STATIC_DRAW);

	}
}


function draw(shape) {
	vertexCount_ = 1;
	shape_ = shape;
}


function clearCanvas() {
	geometries.point.length = 0;
	geometries.hline.length = 0;
	geometries.vline.length = 0;
	geometries.triangle.length = 0;
	geometries.square.length = 0;
}
	
// *************************** MAIN *************************** //

// append frames counter
document.body.appendChild(framesCounterElement);
canvasElement.onmousemove = updatePosition;
canvasElement.onmousedown = drawShape;
draw('point');
// Setup shaders and link program
setupProgram();
// Start rendering
renderLoop();