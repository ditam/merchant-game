// util to get a jquery-like position object from a DOM area object
function getAreaPosition(area) {
  const coordsAttr = area.attr('coords');
  const coords = coordsAttr.split(',');
  return {
    top: parseInt(coords[1],10),
    left: parseInt(coords[0],10)
  };
}

function renderInventory(products, inventory) {
  const inventoryTable = $('#inventory');
  inventoryTable.empty();
  const headerRow = $('<tr>');
  const valuesRow = $('<tr>');
  for (let i=0; i<products.length; i++) {
    headerRow.append($('<th>').text(products[i].name)); // TODO: should be icon
    valuesRow.append($('<td>').text(inventory[i]));
  }
  inventoryTable.append(headerRow);
  inventoryTable.append(valuesRow);
}

function renderPricesTable(towns, products, prices) {
  const table = $('#prices-container table');
  table.empty();
  console.log('renedering table:', table);
  
  // add header row
  const headerRow = $('<tr>');
  headerRow.append($('<th>').text('—'));
  for (let i=0;i<products.length;i++) {
    const headerCell = $('<th>').text(products[i].name);
    headerRow.append(headerCell);
  }
  table.append(headerRow);
  
  // generate town rows
  for (name in towns) {
    const row = $('<tr>');
    row.append($('<td>').text(name));
    for (let i=0;i<prices[name].length;i++) {
      const cell = $('<td>').text(prices[name][i]);
      row.append(cell);
    }
    table.append(row);
  }
}

function renderTradeDialog(townName, town, products, pricesInTown) {
  console.log(town, products, pricesInTown);
  const container = $('#trade-container');
  container.empty();
  
  const icon = $('<img>').attr('src', 'assets/icons/town' + town.type + '.png');
  container.append(icon);
  
  const title = $('<div>').text('Welcome to ' + townName + '!');
  container.append(title);
  
  const table = $('<table>');
  const header = $('<tr><th>Available</th><th>Price</th><th>Sell</th><th>Buy</th></tr>');
  table.append(header);
  
  // generate rows for fruits
  for (let i=0; i<products.length; i++) {
    const row = $('<tr>');
    row.append($('<td>').text(town.stockpiles[i]));
    row.append($('<td>').text(pricesInTown[i]));
    row.append($('<td>').append($('<button>').addClass('sell').text('-1').data('index', i)));
    row.append($('<td>').append($('<button>').addClass('buy').text('+1').data('index', i)));
    table.append(row);
  }
  
  container.append(table);
}

function showMessage(text) {
  const container = $('#message-container');
  container.empty();
  container.text(text);
  container.append($('<div>').addClass('hint').text('Click to dismiss'));
  container.addClass('visible');
}

$(function() {
  // initialize audio assets
  const bgMusic = new Audio('assets/audio/music.mp3');
  const moneySound =  new Audio('assets/audio/money.mp3')
  const discardSound =  new Audio('assets/audio/discard.mp3')
  
  // set bg music to loop
  bgMusic.addEventListener('ended', function() {
    this.currentTime = 0;
    this.play();
  }, false);
  
  // shared state and references
  let soundsOn = false;
  const player = $('#player');
  let money = 100;
  const inventory = [4,0,4,0,0,0,0,0,0,0,0,0];
  const inventory_size = 5;
  function inventoryIsFull() { return inventory.reduce(function(sum, v) {return sum+v;}, 0) >= inventory_size }
  let currentTown = 'Edgemoor';
  
  const towns = {
    Edgemoor: {
      distance: 0,
      type: 1,
      stockpiles: [10,10,10,5,5,5,0,0,0,0,0,0]
    },
    Lorvale: {
      distance: 0,
      type: 1,
      stockpiles: [10,10,0,0,0,0,1,0,0,1,0,0]
    },
    Wildeash: {
      distance: 0,
      type: 1,
      stockpiles: [0,0,20,20,0,5,0,5,0,2,0,1]
    },
    Cliffholt: {
      distance: 1,
      type: 2,
      stockpiles: [50,0,50,0,10,2,0,2,1,5,0,10]
    },
    Janton: {
      distance: 1,
      type: 2,
      stockpiles: [80,10,70,50,0,50,0,3,0,3,0,3]
    },
    Sagewynne: {
      distance: 2,
      type: 3,
      stockpiles: [20,0,20,0,20,0,10,0,10,0,5,0]
    },
    Ostmont: {
      distance: 2,
      type: 3,
      stockpiles: [50,0,50,0,50,0,10,0,10,0,10,0]
    }
  };
  
  const products = [
    {
      name: '1a',
      transformsTo: '1b',
      timeToSpoil: 8,
      minPrice: 1,
      maxPrice: 5
    },
    {
      name: '1b',
      minPrice: 0,
      maxPrice: 2
    },
    {
      name: '2a',
      transformsTo: '2b',
      timeToSpoil: 7,
      minPrice: 2,
      maxPrice: 5
    },
    {
      name: '2b',
      minPrice: 0,
      maxPrice: 3
    },
    {
      name: '3a',
      transformsTo: '3b',
      timeToSpoil: 5,
      minPrice: 2,
      maxPrice: 7
    },
    {
      name: '3b',
      minPrice: 1,
      maxPrice: 5
    },
    {
      name: '4a',
      transformsTo: '4b',
      timeToSpoil: 4,
      minPrice: 5,
      maxPrice: 20
    },
    {
      name: '4b',
      minPrice: 1,
      maxPrice: 8
    },
    {
      name: '5a',
      transformsTo: '5b',
      timeToSpoil: 3,
      minPrice: 15,
      maxPrice: 40
    },
    {
      name: '5b',
      minPrice: 5,
      maxPrice: 10
    },
    {
      name: '6a',
      transformsTo: '6b',
      timeToSpoil: 2,
      minPrice: 40,
      maxPrice: 99
    },
    {
      name: '6b',
      minPrice: 5,
      maxPrice: 50
    },
  ];
  
  const prices = {
    // prices are listed in order 1a, 1b, 2a, 2b etc
    Edgemoor:  [2,1,3,1,4,2,10,4,20,8,40,20],
    Lorvale:   [2,0,3,1,4,2,10,4,20,8,45,20],
    Wildeash:  [3,1,4,1,5,3,10,4,20,8,40,20],
    Cliffholt: [3,1,4,1,5,2,10,4,20,8,50,20],
    Janton:    [3,1,5,2,5,2,10,4,20,8,50,20],
    Sagewynne: [2,0,3,1,4,2,10,4,20,8,65,20],
    Ostmont:   [2,0,3,1,4,2,10,4,20,8,70,20]
  };
  
  // render initial inventory and prices table
  renderInventory(products, inventory);
  renderPricesTable(towns, products, prices);
  
  // connect event handlers
  $('area').click(function() {
    const town = $(this);
    currentTown = town.data('name');
    // hide trade dialog if open
    $('#trade-container').removeClass('visible');
    // move the player marker for feedback
    player.css('top', getAreaPosition(town).top);
    player.css('left', getAreaPosition(town).left);
  });
  
  $('#prices-button').click(function() {
    $('#prices-container').toggleClass('visible');
  });
  
  $('#mute-button').click(function() {
    soundsOn = !soundsOn;
    if (soundsOn) {
      bgMusic.play();
    } else {
      bgMusic.pause();
    }
  });
  
  // Bring up trade dialog when player is clicked
  player.click(function() {
    renderTradeDialog(currentTown, towns[currentTown], products, prices[currentTown]);
    $('#trade-container').addClass('visible');
  });
  
  // Connect delegated handlers for buy and sell actions
  $('#trade-container').on('click', 'button.sell', function() {
    const productIndex = $(this).data('index');
    const price = prices[currentTown][productIndex];
    if (inventory[productIndex] < 1) {
      showMessage('0 units - can not sell.');
      return;
    }
    inventory[productIndex] -= 1;
    money += price;
    if (soundsOn) {
      moneySound.play();
    }
    renderInventory(products, inventory);
  });
  $('#trade-container').on('click', 'button.buy', function() {
    const productIndex = $(this).data('index');
    const price = prices[currentTown][productIndex];
    if (inventoryIsFull()) {
      showMessage('Inventory is full - can not buy.');
      return;
    }
    if (money < price) {
      showMessage('You don\'t have enough money to buy.');
      return;
    }
    inventory[productIndex] += 1;
    money -= price;
    if (soundsOn) {
      moneySound.play();
    }
    renderInventory(products, inventory);
  });
  
  // Hide dialogs on clicking
  $('#prices-container').click(function() {
    $('#prices-container').removeClass('visible');
  });
  $('#message-container').click(function() {
    $('#message-container').removeClass('visible');
  });
  
  // display opening message
  showMessage('Welcome, this is a message for you.\nClick on your banner to start trading.');
});
