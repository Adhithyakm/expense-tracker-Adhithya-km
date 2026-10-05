function get(sel) {
  return document.querySelector(sel);
}

    let defaultCats={
  income: ['Salary','Freelance','Gift','Other'],
  expense: ['Food','Rent','Travel','Shopping','Bills','Other']
};

  let colors = ['#d6453d', '#e8913a', '#e5c93b', '#4fa66a', '#3a8fb7', '#6a5acd', '#b455a8', '#8a8f8c'];
let transactions=[];
let customCats={ income: [], expense: [] 

};

try {
  let savedTx=localStorage.getItem('et_transactions');
  let savedCats=localStorage.getItem('et_categories');
  if (savedTx) transactions=JSON.parse(savedTx);
  if (savedCats) customCats=JSON.parse(savedCats);
} 
  catch (err) {
    transactions=[];
  customCats={ income:[],expense:[] };
}

  let currentType = 'expense';
  let editId = null;
  let selectedId = null;

 function save() {
   localStorage.setItem('et_transactions',JSON.stringify(transactions));
   localStorage.setItem('et_categories',JSON.stringify(customCats));
}

  function getCats(type) {
    return defaultCats[type].concat(customCats[type]);
}

  function money(amt) {
   return '₹'+Number(amt).toLocaleString('en-IN',{ minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function today() {
  let now = new Date();
  let mm = String(now.getMonth() + 1).padStart(2, '0');
  let dd = String(now.getDate()).padStart(2, '0');
return now.getFullYear()+'-'+ mm +'-' + dd;
}
function clean(text) {
  return String(text).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g, '&#39;');
}

function showPage(pageId) {
  let pages=document.querySelectorAll('.page');
  for(let i=0;i<pages.length; i++) {
    pages[i].hidden=pages[i].id!=pageId;
  }
  window.scrollTo(0, 0);
}

function findTx(id) {
  for (let i=0;i<transactions.length; i++) {
    if (transactions[i].id==id) return transactions[i];
  }
  return null;
}

function getChecked() {
  let boxes=document.querySelectorAll('#catBoxes input:checked');
  let values=[];
  for (let i=0;i<boxes.length;i++) {
    values.push(boxes[i].value);
  }
  return values;
}
function getList() {
  let type=get('#typeFilter').value;
  let month=get('#monthPick').value;
  let sortBy=get('#sortSelect').value;
  let checked=getChecked();

  let list=[];
  for (let i=0;i<transactions.length; i++) {
    let tx=transactions[i];
    if (type!='all' && tx.type!=type)
         continue;
    if (checked.length>0 && !checked.includes(tx.category)) 
      continue;
    if (month && !tx.date.startsWith(month)) 
      continue;
    list.push(tx);
  }

  list.sort(function (a, b) {
    if (sortBy=='date-desc') 
      return b.date.localeCompare(a.date);
    if (sortBy=='date-asc') 
      return a.date.localeCompare(b.date);
    if (sortBy=='amt-desc') 
      return b.amount-a.amount;
    return a.amount-b.amount;
  });

  return list;
}

function renderChecks() {
  let type=get('#typeFilter').value;
  let oldChecked=getChecked();
  let types=[type];
  if (type=='all') 
    types = ['income','expense'];
  let names=[];
  for (let i=0;i<types.length;i++) {
    let cats=getCats(types[i]);
    for (let j=0;j<cats.length;j++) {
      if(!names.includes(cats[j])) names.push(cats[j]);
    }
  }

  let html = '';
  for (let i= 0;i<names.length;i++) {
    let isChecked=oldChecked.includes(names[i])?'checked' : '';
    html +='<label><input type="checkbox" value="'+clean(names[i])+'" '+isChecked+'> '+clean(names[i])+'</label>';
  }
  get('#catBoxes').innerHTML=html;
}

function render() {
  let totalIn = 0;
  let totalOut = 0;
  for (let i = 0; i < transactions.length; i++) {
    if (transactions[i].type == 'income') 
      totalIn +=transactions[i].amount;
    else 
      totalOut +=transactions[i].amount;
  }
  get('#totalIncome').textContent=money(totalIn);
  get('#totalExpense').textContent=money(totalOut);
  get('#balance').textContent=money(totalIn - totalOut);

  let list=getList();
  let html='';
  for (let i=0;i<list.length;i++) {
    let tx=list[i];
    let sign= tx.type=='income' ? '+' : '-';
    html +='<li><button class="item '+tx.type+'" data-id="'+tx.id +'">';
    html += '<span>'+clean(tx.category)+'<small>'+tx.date+'</small></span>';
    html +='<span class="amt">'+sign+money(tx.amount) +'</span>';
    html += '</button></li>';
  }
  get('#list').innerHTML=html;
  get('#emptyMsg').hidden=list.length > 0;
  if (transactions.length == 0) {
    get('#emptyMsg').textContent='No transactions yet. Add your first income or expense below.';
  } else {
    get('#emptyMsg').textContent='No transactions match your filters.';
  }
}
function openForm(type, tx) {
  currentType=type;

if (tx) {
    editId=tx.id;
    get('#formTitle').textContent='Edit '+type;
    get('#amount').value=tx.amount;
    get('#category').value=tx.category;
    get('#date').value=tx.date;
    get('#note').value=tx.note;
  } 
  else {
    editId=null;
    get('#formTitle').textContent='Add '+type;
    get('#amount').value ='';
    get('#category').value ='';
    get('#date').value=today();
    get('#note').value='';
  }
  let cats=getCats(type);
  let options='';
  for (let i=0;i<cats.length;i++) {
    options +='<option value="'+clean(cats[i]) +'">';
  }
  get('#catOptions').innerHTML=options;

  get('#date').max = today();
  clearErrors();
  showPage('formPage');
}

function clearErrors() {
  let errors=document.querySelectorAll('.error');
  for (let i=0; i<errors.length;i++) errors[i].textContent='';

  let bad=document.querySelectorAll('.invalid');
  for (let i=0; i<bad.length;i++) bad[i].classList.remove('invalid');
}

function showError(field, msg) {
  get('#'+field +'Err').textContent=msg;
  get('#'+field).classList.add('invalid');
}
  
function checkForm() {
  clearErrors();
  let ok=true;

  let amountText=get('#amount').value.trim();
  let amount=Number(amountText);
  let category=get('#category').value.trim().replace(/\s+/g, ' ');
  let date=get('#date').value;
  let note=get('#note').value.trim();

  if (amountText=='') {
    showError('amount','Amount cannot be empty.');
    ok=false;
  } else if(isNaN(amount)||amount<=0) {
    showError('amount','Enter an amount greater than 0.');
    ok=false;
  } else if(amount>1000000000) {
    showError('amount','Amount is too large.');
    ok=false;
  }

  if (category=='') {
    showError('category', 'Choose a category or type a new one.');
    ok=false;
  } else if(category.length > 30) {
    showError('category', 'Category must be 30 characters or fewer.');
    ok=false;
  }

  if (date=='') {
    showError('date','Please choose a date.');
    ok=false;
  } else if(date > today()) {
    showError('date','Date cannot be in the future.');
    ok=false;
  }

  if (note.length>200) {
    showError('note','Note must be 200 characters or fewer.');
    ok = false;
  }

  if (!ok)
     return null;

  return {
    amount:Math.round(amount*100)/100, 
    category:category,
    date:date,
    note:note
  };
}

get('#myForm').addEventListener('submit',function(e) {
  e.preventDefault();

  let data=checkForm();
  if(!data)
     return;

  let cats = getCats(currentType);
  let found = false;
  for (let i = 0; i < cats.length; i++) {
    if (cats[i].toLowerCase() == data.category.toLowerCase()) {
      data.category = cats[i];
      found = true;
    }
  }
  if (!found) customCats[currentType].push(data.category);

  if (editId) {
    let tx = findTx(editId);
    tx.amount = data.amount;
    tx.category = data.category;
    tx.date = data.date;
    tx.note = data.note;
  } else {
    transactions.push({
      id: Date.now().toString(),
      type: currentType,
      amount: data.amount,
      category: data.category,
      date: data.date,
      note: data.note
    });
  }

  save();
  renderChecks();
  render();
  showPage('dashboard');
});


function openDetail(id) {
  let tx =findTx(id);
  if (!tx)
     return;
  selectedId =id;

  let note = '—';
  if (tx.note) note =clean(tx.note);

  get('#detailBody').innerHTML =
    '<div><span>Type</span>' +tx.type+'</div>' +
    '<div><span>Amount</span>'+money(tx.amount)+'</div>' +
    '<div><span>Category</span>'+clean(tx.category)+'</div>' +
    '<div><span>Date</span>'+tx.date+'</div>' +
    '<div><span>Note</span>'+note+'</div>';

  showPage('detailPage');
}

function monthTotal(type, month) {
  let total=0;
  for (let i=0;i<transactions.length;i++) {
    let tx=transactions[i];
    if (tx.type==type && tx.date.startsWith(month)) 
      total +=tx.amount;
  }
  return total;
}

function renderCharts() {
  let months=[];
  let now=new Date();
  let year=now.getFullYear();
  let m =now.getMonth() + 1;

  for (let i =0;i<6;i++) {
    months.unshift(year + '-' + String(m).padStart(2, '0'));
    m--;
    if (m ==0) {
      m =12;
      year--;
    }
  }

  let inList=[];
  let outList=[];
  let biggest=1; 
  for (let i =0;i< months.length;i++) {
    inList[i]=monthTotal('income', months[i]);
    outList[i]=monthTotal('expense', months[i]);
    if (inList[i]>biggest) 
      biggest = inList[i];
    if (outList[i]>biggest) 
      biggest = outList[i];
  }

  let barsHtml = '';
  for (let i = 0; i < months.length; i++) {
    barsHtml +='<div class="barRow"><span>'+months[i] +'</span><div>';
    barsHtml += '<div class="bar green" style="width:'+(inList[i] / biggest * 100) + '%"></div>';
    barsHtml +='<div class="bar red" style="width:'+(outList[i] / biggest * 100) + '%"></div>';
    barsHtml +='<small>In ' +money(inList[i]) +' · Out '+money(outList[i])+'</small>';
    barsHtml +='</div></div>';
  }
  get('#monthBars').innerHTML = barsHtml;

  let month=get('#chartMonth').value;
  let catTotals ={};
  for (let i=0;i<transactions.length; i++) {
    let tx=transactions[i];
    if (tx.type!='expense') 
      continue;
    if (month &&!tx.date.startsWith(month))
       continue;
    if (!catTotals[tx.category]) catTotals[tx.category] = 0;
    catTotals[tx.category] += tx.amount;
  }

  let items = [];
  let total = 0;
  for (let name in catTotals) {
    items.push({ name: name, value: catTotals[name] });
    total += catTotals[name];
  }
  items.sort(function (a, b) {
    return b.value - a.value;
  });

  
  if (total == 0) {
    get('#pieEmpty').hidden =false;
    get('#pie').hidden= true;
    get('#legend').hidden =true;
    return;
  }

  get('#pieEmpty').hidden =true;
  get('#pie').hidden =false;
  get('#legend').hidden =false;

  let colorStops = [];
  let legendHtml ='';
  let sofar = 0;
  for (let i=0; i<items.length;i++) {
    let color=colors[i % colors.length];
    let start =sofar /total*100;
    sofar +=items[i].value;
    let end = sofar / total * 100;
    colorStops.push(color + ' '+ start + '% '+end + '%');

    let percent = Math.round(items[i].value / total * 100);
    legendHtml +='<li><i style="background:'+color + '"></i>'+ clean(items[i].name) + ': ' + money(items[i].value) + ' (' + percent + '%)</li>';
  }

  get('#pie').style.background ='conic-gradient('+colorStops.join(',') + ')';
  get('#legend').innerHTML=legendHtml;
}



function goHome() {
  showPage('dashboard');
}

  get('#startBtn').onclick =goHome;
  get('#formBack').onclick =goHome;
  get('#detailBack').onclick =goHome;
  get('#chartBack').onclick =goHome;
 
  get('#addIncomeBtn').onclick=function () {
  openForm('income');
};
get('#addExpenseBtn').onclick=function () {
  openForm('expense');
};

get('#todayBtn').onclick=function () {
  get('#date').value=today();
};

get('#filterBtn').onclick=function () {
  get('#filterBox').hidden =!get('#filterBox').hidden;
};
get('#sortBtn').onclick =function () {
  get('#sortBox').hidden =!get('#sortBox').hidden;
};

get('#chartBtn').onclick = function () {
  get('#chartMonth').value =today().slice(0, 7);
  renderCharts();
  showPage('chartPage');
};
get('#chartMonth').onchange =renderCharts;

get('#typeFilter').onchange =function () {
  renderChecks();
  render();
};
get('#catBoxes').onchange =render;
get('#sortSelect').onchange =render;
get('#monthPick').onchange =render;

get('#clearBtn').onclick =function () {
  get('#typeFilter').value='all';
  get('#monthPick').value='';
  get('#sortSelect').value='date-desc';

  let boxes = document.querySelectorAll('#catBoxes input');
  for (let i=0;i<boxes.length;i++) {
    boxes[i].checked =false;
  }

  renderChecks();
  render();
};
get('#list').onclick =function (e) {
  let btn = e.target.closest('.item');
  if (btn) openDetail(btn.dataset.id);
};

get('#editBtn').onclick = function () {
  let tx = findTx(selectedId);
  if (tx) openForm(tx.type, tx);
};

get('#deleteBtn').onclick =function () {
  if (!confirm('Delete this transaction? This cannot be undone.')) 
    return;

  let keep = [];
  for (let i=0; i< transactions.length;i++) {
    if (transactions[i].id != selectedId) keep.push(transactions[i]);
  }
  transactions = keep;

  save();
  render();
  showPage('dashboard');
};

renderChecks();
render();