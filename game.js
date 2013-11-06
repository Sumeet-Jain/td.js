var BLOCKSIZE = 52,
    towers = [],
    creeps = [],
    projectiles = [],
    draggingItem = false,
    mouseX = null,
    mouseY = null,
    grid;

function removeFromArr(array, element) {
    var index = array.indexOf(element);
    if (index != -1)
        array.splice(index, 1);
};

function Square(x, y, node) {
    this.xPos = x || 0;
    this.yPos = y || 0;
    this.canWalk = true;
    this.canBuild = true;
    this.node = node;
};

function GridObj(x, y, grid) {
    this.xPos = x || 0;
    this.yPos = y || 0;
    this.grid = grid;
}

Tower.prototype = new GridObj();

function Tower(x, y, grid) {
    GridObj.call(this, x, y, grid);
    this.name = 'basic';
    this.range = 4;
    this.currCooldown = 0;
    this.cooldown = 500;
};

Tower.prototype.attack = function(interval) {
    var shortestD = Number.MAX_VALUE,
        nearestCreep = null;
    this.currCooldown -= interval;
    if (this.currCooldown <= 0) {
        for (var i = 0; i < creeps.length; i++) {
            var creep = creeps[i],
                distance = Math.pow(creep.xPos - this.xPos, 2) + Math.pow(creep.yPos - this.yPos, 2);
            if (distance < this.range * this.range && distance < shortestD) {
                nearestCreep = creep;
                shortestD = distance
            }
        }

        if (nearestCreep) {
            var projectile = new Projectile(this.xPos, this.yPos, this.grid, nearestCreep);
            projectile.fire();
            this.currCooldown = this.cooldown;
        }
    }
};

Projectile.prototype = new GridObj();
function Projectile(x, y, grid, creep) {
    GridObj.call(this, x, y, grid);
    this.creep = creep;
    this.damage = 1;
    this.speed = 100;
}

Projectile.prototype.fire = function() { 
    projectiles.push(this);
}

Projectile.prototype.move = function(interval) {
    var destX = this.creep.xPos,
        destY = this.creep.yPos,
        xDist = destX - this.xPos,
        yDist = destY - this.yPos,
        totalDist = Math.sqrt(Math.pow(xDist, 2) + Math.pow(yDist, 2)),
        delta = BLOCKSIZE / 500;
    if (this.creep.hp > 0) { 
        this.xPos += (xDist / totalDist) * interval / this.speed;
        this.yPos += (yDist / totalDist) * interval / this.speed;
    } 

    //If hit
    if (Math.abs(this.xPos - destX) < delta && Math.abs(this.yPos - destY) < delta || this.creep.hp <= 0) {
        this.creep.getHit(this.damage);
        removeFromArr(projectiles, this);
        return true;
    }
}

Projectile.prototype.draw = function(canvas, ctx) { 
    ctx.fillStyle = "white";
    ctx.beginPath();
    var offset = BLOCKSIZE/2
    ctx.arc(this.xPos*BLOCKSIZE + offset,  this.yPos*BLOCKSIZE + offset, 2, 0, 2*Math.PI, false);
    ctx.fill();
    ctx.closePath();
}

function Grid() {
    this.rows = 10;
    this.cols = 20;
    this.grid = new Array(this.rows);
    this.startX = 0;
    this.startY = Math.floor(this.rows/2);
    this.endX = this.cols - 1;
    this.endY = Math.floor(this.rows/2);

    for(var i = 0; i < this.grid.length; i++) {
        this.grid[i] = new Array(this.cols);
    }
}

Grid.prototype.createGrid = function () {
    var x = 0,
        y = 0,
        board = document.getElementById("board"),
        menu = document.getElementById("menu"),
        squareNode,
        canvas,
        sq;

    board.style.width = BLOCKSIZE * (this.cols) + "px";
    board.style.height = BLOCKSIZE * (this.rows) + "px";
    //menu.style.left = BLOCKSIZE * (this.cols) + 200 + "px";
    //menu.style.height = BLOCKSIZE * (this.rows) + 200 + "px";

    canvas = document.createElement('canvas');
    canvas.id = "canvas";
    canvas.width = BLOCKSIZE * this.cols;
    canvas.height = BLOCKSIZE * this.rows;
    board.appendChild(canvas);
    for(y = 0; y < this.rows; y++) {
        for(x = 0; x < this.cols; x++) {
            squareNode = document.createElement('div');
            squareNode.id = "sq" + x + "-" + y;
            squareNode.className += "square ";
            board.appendChild(squareNode);
            this.grid[y][x] = new Square(x, y, squareNode);
        }
    }

    sq = this.grid[Math.floor(this.rows/2)][0];
    sq.node.style.background = "rgb(100,100,0)";
    sq.canBuild = false;
    sq = this.grid[this.endY][this.endX];
    sq.node.style.background = "rgb(100,100,0)";
    sq.canBuild = false;
};

Grid.prototype.inGrid = function(x, y) {
    return x >= 0 && x < this.cols && y >= 0 && y < this.rows && this.grid[y][x].canWalk;
};

Grid.prototype.findShortestPath = function(startX, startY, endX, endY) {;
    var visited = new Array(this.rows),
        queue = [],
        x = 0,
        y = 0,
        nextEle;

    for(y = 0; y < visited.length; y++) { 
        visited[y] = new Array(this.cols);
    }

    function enqueue(queObj, gridRef) {
        //gridRef is the gridRefect which the parent function is in. Cant use keyword this
        //Only looks at left, right, up, and down of current square
        var x = queObj.x,
            y = queObj.y,
            previous = queObj.moves;

        if (x === endX && y === endY) 
            return {x: x, y: y, moves: previous || ''};

        x++;
        previous = previous || '';
        if (gridRef.inGrid(x, y) && !visited[y][x]) {
            queue.push({x: x, y: y, moves: previous + 'r'});
            visited[y][x] = true;
        }

        x -= 2;
        if (gridRef.inGrid(x, y) && !visited[y][x]) {
            queue.push({x: x, y: y, moves: previous + 'l'});
            visited[y][x] = true;
        }

        x++;
        y++;
        if (gridRef.inGrid(x, y) && !visited[y][x]) {
            queue.push({x: x, y: y, moves: previous + 'd'});
            visited[y][x] = true;
        }

        y -= 2;
        if (gridRef.inGrid(x, y) && !visited[y][x]) {
            queue.push({x: x, y: y, moves: previous + 'u'});
            visited[y][x] = true;
        }
    };

    nextEle = enqueue({x: startX, y: startY}, this);
    if (nextEle)
        return nextEle;

    while (queue.length) {
        nextEle = enqueue(queue.shift(), this);
        if (nextEle) {
            return nextEle;
        }
    }
};

Grid.prototype.sendCreep = function(Creep) {
    var creep = new Creep(this.startX, this.startY, this);
    creeps.push(creep);
};

Grid.prototype.sendWave = function(Creep, number, timeout) {
    timeout = timeout || 250;
    var grid = this;
    grid.sending = true;
    function sender() {
        if (number) {
            grid.sendCreep(Creep);
            number--;
            setTimeout(function () {sender()}, timeout);
        } else {
            grid.sending = false;
        }
    }
    return sender;
}


Grid.prototype.buildTower = function(Tower, x , y) {
    if(this.inGrid(x,y)) {
        var square = this.grid[y][x];
        square.canWalk = false;
        if (square.canBuild && this.findShortestPath(this.startX, this.startY, this.endX, this.endY)) {
            var tower = new Tower(x, y, this);
            square.canBuild = false;
            square.canWalk = false;
            square.node.style.background = 'rgb(255, 0, 0)';
            towers.push(tower);
            return true;
        }
        square.canWalk = true
    }
    return false;
};

Creep.prototype = new GridObj();

function Creep(xPos, yPos, grid, movelist) { 
    GridObj.call(this, xPos, yPos, grid);
    this.currSquare = null;
    this.nextSquare = null;
    this.movelist = movelist || this.grid.findShortestPath(this.xPos, this.yPos, grid.endX, grid.endY).moves;
    this.hp = 5;
};

Creep.prototype.move = function(interval, speed) { 
    speed = speed || 1000;
    if (this.movelist === '') { 
        removeFromArr(creeps, this);
        return true;
    }

    var move = this.movelist.charAt(0);
    if (this.nextSquare === null) {
        if (this.currSquare !== null) {
            this.movelist = this.grid.findShortestPath(Math.floor(this.xPos), Math.floor(this.yPos), this.grid.endX, this.grid.endY).moves;
            move = this.movelist.charAt(0);
        }
        this.currSquare = {x: this.xPos, y: this.yPos};
        if (move === 'r') 
            this.nextSquare = {x: this.xPos + 1, y: this.yPos, dir: 'r'}
        else if (move === 'l')
            this.nextSquare = {x: this.xPos - 1, y: this.yPos, dir: 'l'}
        else if (move === 'd') 
            this.nextSquare = {x: this.xPos, y: this.yPos + 1, dir: 'd'}
        else if (move === 'u')
            this.nextSquare = {x: this.xPos, y: this.yPos - 1, dir: 'u'}
    }

    if (move === 'r') 
        this.xPos += interval / speed;
    else if (move === 'l') 
        this.xPos -= interval / speed;
    else if (move === 'd') 
        this.yPos += interval / speed;
    else if (move === 'u') 
        this.yPos -= interval / speed;

    if (this.nextSquare) {
        var dir = this.nextSquare.dir;
        if (dir === 'r' && this.xPos >= this.nextSquare.x) { 
            var difference = this.xPos - this.nextSquare.x;
            this.xPos = this.nextSquare.x;
            this.nextSquare = null;
            return this.move(difference  * speed, speed);
        } else if (dir === 'l' && this.xPos  <= this.nextSquare.x) {
            var difference = this.nextSquare.x - this.xPos;
            this.xPos = this.nextSquare.x;
            this.nextSquare = null;
            return this.move(difference  * speed, speed);
        } else if (dir === 'd' && this.yPos  >= this.nextSquare.y) {
            var difference = this.yPos - this.nextSquare.y;
            this.yPos = this.nextSquare.y;
            this.nextSquare = null;
            return this.move(difference  * speed, speed);
        } else if (dir === 'u' && this.yPos  <= this.nextSquare.y) {
            var difference = this.nextSquare.y - this.yPos;
            this.yPos = this.nextSquare.y;
            this.nextSquare = null;
            return this.move(difference  * speed, speed);
        }
    }
    return false;
};

Creep.prototype.draw = function(canvas, ctx) {
    ctx.fillStyle = "black";
    ctx.beginPath();
    var offset = BLOCKSIZE / 2;
    ctx.arc(this.xPos*BLOCKSIZE + offset, this.yPos*BLOCKSIZE + offset, 5, 0, 2*Math.PI, false);
    ctx.fill();
    ctx.closePath();
};

Creep.prototype.getHit = function(damage) {
    if (this.hp > 0) {
        this.hp -= damage;
        if (this.hp <= 0) {
            removeFromArr(creeps, this);
        }
    }
}

function Menu() {
    this.towerList = [];
}

Menu.prototype.update = function() {
    var menuNode = document.getElementById('menu'),
        i,
        node;
    for (i = 0; i < this.towerList.length; i++) {
        node = document.createElement('div');
        node.className = this.towerList[i].name;
        node.addEventListener("click", function (e) {
            draggingItem = this;
            mouseX = e.pageX;
            mouseY = e.pageY;
        });
        menuNode.appendChild(node);
    }
}
        

grid = new Grid();
grid.createGrid();
grid.buildTower(Tower, 0, 8);
grid.buildTower(Tower, 1, 8);
grid.buildTower(Tower, 3, 8);
grid.buildTower(Tower, 2, 8);
grid.buildTower(Tower, 3, 7);
grid.buildTower(Tower, 3, 6);
grid.buildTower(Tower, 3, 5);
grid.buildTower(Tower, 3, 4);
grid.buildTower(Tower, 3, 3);
grid.buildTower(Tower, 2, 2);
grid.buildTower(Tower, 1, 2);
grid.buildTower(Tower, 3, 7);
grid.buildTower(Tower, 3, 7);
grid.buildTower(Tower, 0, 4);
grid.buildTower(Tower, 0, 4);
grid.buildTower(Tower, 1, 5);
grid.buildTower(Tower, 1, 6);
grid.buildTower(Tower, 11, 6);
grid.buildTower(Tower, 10, 5);
grid.buildTower(Tower, 11, 5);

var numOfCreeps = 10,
    prevTime;

grid.sendWave(Creep, 20, 50)();
    

function draw(timestamp) { 
    prevTime = prevTime || timestamp;
    var canvas = document.getElementById("canvas"),
        ctx = canvas.getContext("2d"),
        speed = 1000, 
        hit = false,
        died = false,
        finished = true,
        interval = timestamp - prevTime;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (draggingItem) {
        ctx.fillStyle = "red";
        ctx.fillRect(mouseX - BLOCKSIZE/2 - 3, mouseY - BLOCKSIZE/2 - 3, BLOCKSIZE, BLOCKSIZE);
    }

    for (var i = 0; i < towers.length; i++) { 
        towers[i].attack(interval);
    }
    
    for (var i = 0; i < projectiles.length; i++) {
        hit = projectiles[i].move(interval);
        if (!hit) 
            projectiles[i].draw(canvas, ctx);
    }

    for (var i = 0; i < creeps.length; i++) {
        died = creeps[i].move(interval, speed);
        if (!died) 
            creeps[i].draw(canvas, ctx);
    }

    prevTime = timestamp;
    if (creeps.length || projectiles.length || grid.sending)
        window.requestAnimationFrame(draw);
    else {
        window.requestAnimationFrame(draw);
    } 
};

function setup() { 
    var board = document.getElementById('board');
    function callback(e) {
        if (draggingItem) {
            var x = Math.floor(e.pageX / BLOCKSIZE),
                y = Math.floor(e.pageY / BLOCKSIZE);
            grid.buildTower(window[draggingItem.className], x, y);
            draggingItem = false;
        }
    };
    board.addEventListener("click", callback);
    board.addEventListener("mousemove", function (e) {
        var canvas = document.getElementById("canvas"),
            ctx = canvas.getContext("2d");
        if (draggingItem) {
            mouseX = e.pageX;
            mouseY = e.pageY;
        }
    });
    menu = new Menu();
    menu.towerList.push(Tower);
    menu.update();
   window.requestAnimationFrame(draw);
};

setup();
