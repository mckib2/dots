// Find the container to hold the score
let scoreWindow = document.getElementById('score-window');
let scoreField = document.getElementById('cur-score');
scoreField.innerHTML = '0';

// Find the container to hold the entire game in
let dotsWindow = document.getElementById('dots-window');
jsPlumb.bind("ready", function() {
    jsPlumb.setContainer(dotsWindow);
});


// Globals
let dotChain = [];
let isMouseDown = false;
document.addEventListener('mouseup', function(ev) {
    isMouseDown = false;

    // Remove mark on selected dots and remove all connections
    document.querySelectorAll('.selected').forEach(function(el) {
        removeSelectedClasses(el);
    });
    jsPlumb.deleteEveryEndpoint();

    // Get some important info from the map
    let xstep = myMap.width/myMap.cols;
    let ystep = myMap.height/myMap.rows;

    // Kaplooy went the dots!
    if (dotChain.length > 1) {

        // See if we got a square:
        if (isSquare()) {

            // If we got a square, then all of that color goes kaplooy!
            let curColor = document.getElementById(dotChain[0]).style.backgroundColor;
            dotChain = [];
            for(ii = 0; ii < myMap.rows; ++ii) {
                for(jj = 0; jj < myMap.cols; ++jj) {
                    if (document.getElementById(ii + '-' + jj).style.backgroundColor === curColor) {
                        dotChain.push(ii + '-' + jj);
                    }
                }
            }
        }

        // Travel from bottom to top up each column and tell each dot how far
        // it needs to travel based on encountered holes
        for (jj = myMap.cols - 1; jj >= 0; --jj) {

            // Keep a running tally of how many we need to fall in this column
            toFall = 0;

            for (ii = myMap.rows - 1; ii >= 0; --ii) {
                let id = jj + '-' + ii;
                let el = document.getElementById(id);

                if (dotChain.includes(id)) {
                    toFall += 1;
                    el.remove();

                    // Replace dot we removed and let it fall to correct place
                    let newEl = makeDot(jj, 0, jj*xstep, 0, xstep*(1 - myMap.pad), ystep*(1 - myMap.pad), chooseColor(myMap.colors));
                    letDotFall(newEl, toFall-1);
                }
                else if (toFall > 0) {
                    letDotFall(el, toFall);
                }
            }
        }
    }

    // Award points
    if (dotChain.length > 1) {
        scoreField.innerHTML = parseInt(scoreField.innerHTML, 10) + dotChain.length;
    }

    // Clear out the chain for next move
    dotChain = [];
});

// Params
let dotsWidth = 500; // Probably best that it's square
let dotsHeight = 500;

// Create a map
let myMap = {
    cols: 6,
    rows: 6,
    width: dotsWidth,
    height: dotsHeight,
    pad: .4,
    colors: [ 'Purple','Lime','Red' ],
    selectedClasses: [ 'pulse' ],
    disabled: []
}

// Initialize the game window
resizeGame(dotsWidth, dotsHeight);

// Fill in the map
fillMap(myMap);

function isSquare() {
    // Determine if current dotChain forms a square
    if (dotChain.length === 4) {
        return(true);
    }
    else {
        return(false);
    }
}

function resizeGame(width, height) {
    dotsWindow.style.width = width + 'px';
    dotsWindow.style.height = height + 'px';
}

function letDotFall(el, numToFall) {

    // Make the ID and el params correct
    el.setAttribute('jj',parseInt(el.getAttribute('jj'), 10) + numToFall);
    el.id = el.getAttribute('ii') + '-' + el.getAttribute('jj');

    // Fall info
    let dist = myMap.height/myMap.rows;
    let ref = parseFloat(el.style.top)
    let step = dist/20;

    // Do the fall
    let id = setInterval(function() {
        let curPos = parseFloat(el.style.top);

        if ((curPos - ref) > dist*numToFall) {
            // Put it in the right place to end with -- not sure this working
            el.style.top = dist*el.getAttribute('jj') + 'px';
            step = 0; // make sure it doesn't move before we clearInterval
            clearInterval(id);
        }
        el.style.top = curPos + step + 'px';
    }, 10);
}

function selectDot(el,connection=true) {

    // Detect duplicate element
    if (dotChain.indexOf(el.id) !== -1) {
        return;
    }

    // Add it to the chain
    dotChain.push(el.id);

    // If the new chain is now a square, we want to highlight all the same-
    // colored dots
    if (isSquare()) {
        addSquareExtraSelections();
    }
    else {
        // Make sure we don't errantly highlight dots we don't want to
        removeSquareExtraSelections();
    }

    // Mark selected dots
    addSelectedClasses(el);

    // Make a connection between the last dot and the newly selected one
    if (connection) {
        let lastDotID = dotChain[dotChain.length - 2];
        let lastDot = document.getElementById(lastDotID);
        makeLink(lastDot,el);
    }
}

function unselectDot(el) {

    // If the chain is currently a square, it soon won't be...
    if (isSquare()) {
        removeSquareExtraSelections();
    }

    // Remove the unselected dot and associated connections
    dotChain.pop();
    removeSelectedClasses(el);
    jsPlumb.deleteConnectionsForElement(el);

    // If the new chain is a square, add the rest of the same colored dots
    if (isSquare()) {
        addSquareExtraSelections();
    }
}

function addSquareExtraSelections() {
    // If we got a square, then select all the same colored dots
    let curColor = document.getElementById(dotChain[0]).style.backgroundColor;
    for(ii = 0; ii < myMap.rows; ++ii) {
        for(jj = 0; jj < myMap.cols; ++jj) {
            if (document.getElementById(ii + '-' + jj).style.backgroundColor === curColor) {
                addSelectedClasses(document.getElementById(ii + '-' + jj));
            }
        }
    }
}
function removeSquareExtraSelections() {
    let curColor = document.getElementById(dotChain[0]).style.backgroundColor;
    for(ii = 0; ii < myMap.rows; ++ii) {
        for(jj = 0; jj < myMap.cols; ++jj) {
            let el = document.getElementById(ii + '-' + jj);
            if ((el.style.backgroundColor === curColor) && (dotChain.indexOf(el.id) === -1)) {
                removeSelectedClasses(el);
            }
        }
    }
}

function addSelectedClasses(el) {
    el.classList.add('selected');
    myMap.selectedClasses.forEach(function(class_) {
        el.classList.add(class_);
    });
}
function removeSelectedClasses(el) {
    el.classList.remove('selected');
    myMap.selectedClasses.forEach(function(class_) {
        el.classList.remove(class_);
    });
}

function makeLink(prev, next) {
    jsPlumb.connect({
        source:prev,
        target:next,
        connector:['Straight'],
        paintStyle: { stroke:prev.style.backgroundColor, strokeWidth:10 },
        anchor:'Center',
        endpointStyle: { 'display':'none' },
    });
}

function isNeighbor(n1, n2) {
    x1 = n1.getAttribute('ii');
    y1 = n1.getAttribute('jj');
    x2 = n2.getAttribute('ii');
    y2 = n2.getAttribute('jj');

    if (Math.abs(x1 - x2) + Math.abs(y1 - y2) == 0) {
        // An element is not a neighbor with itself
        return(false);
    }
    else if ((Math.abs(x1 - x2) <= 1) && (Math.abs(y1 - y2) <= 1)) {
        // Actual neighbor
        return(true);
    }
    else {
        // Not a neighbor
        return(false);
    }
}

function isSameColor(n1, n2) {
    c1 = n1.style.backgroundColor;
    c2 = n2.style.backgroundColor;

    if (c1 === c2) {
        return(true);
    }
    else {
        return(false);
    }
}

function makeDot(ii, jj, x, y, width, height, color) {

    // Let each dot be a div element
    let el = document.createElement('div');
    el.id = ii + '-' + jj;
    el.setAttribute('ii', ii);
    el.setAttribute('jj', jj);
    el.style.position = 'absolute';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.backgroundColor = color

    // Make the dot a circle
    let diameter = Math.min(width, height);
    el.style.width = diameter + 'px';
    el.style.height = diameter + 'px';
    el.style.borderRadius = '50%';

    // Add some classes to make it POP!
    el.classList.add('hvr-pop');

    // Add event listeners so we know when we're pressing buttons!
    el.addEventListener('mousedown', function(ev) {
        ev.preventDefault();
        isMouseDown = true;
        selectDot(this,false);
    });
    el.addEventListener('mouseenter', function(ev) {
        ev.preventDefault();
        if (isMouseDown) {

            let lastDotID = dotChain[dotChain.length - 1];
            let lastDot = document.getElementById(lastDotID);

            if (dotChain.length >= 2) {
                prevDotID = dotChain[dotChain.length - 2];

                // If the one we just entered is the last dot we selected, unselect
                if (prevDotID === this.id) {
                    unselectDot(lastDot);
                    return;
                }
            }

            // Select the new dot if you dare...
            if (isNeighbor(el, lastDot) && isSameColor(el, lastDot)) {
                selectDot(this);
            }
        }
    });

    // Add it to the window
    dotsWindow.append(el);
    return(el);
}

function chooseColor(colors) {
    return(colors[Math.floor(Math.random() * colors.length)])
}

function fillMap(map) {

    let xstep = map.width/map.rows;
    let ystep = map.height/map.cols;

    for(ii = 0; ii < map.rows; ++ii) {
        for(jj = 0; jj < map.cols; ++jj) {
            makeDot(ii, jj, ii*xstep, jj*ystep, xstep*(1 - map.pad), ystep*(1 - map.pad), chooseColor(map.colors));
        }
    }
}
