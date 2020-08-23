// begin lib
var RackBuilder = (function namespace() {
    
    class Builder {
        constructor(rack, hardwareList) {
            this.rack = rack;
            this.hardwareList = hardwareList;
            this.frontview = null;
            this.unitsMap = null;
        }

        createUnitsMap() {
            this.unitsMap = new Array(this.rack.size + 1);
            this.hardwareList.forEach(hw => {
                hw.units.forEach(unit => {
                    if (hw.type == "switch" || hw.type == "unitserver") {
                        this.unitsMap[unit] = hw;
                    }
                    else if (hw.type == "bladechassis") {
                        this.unitsMap[unit] = hw;
                        hw.childs = new Array(hw.childsize * 2 + 1);
                    }
                });

                if (hw.type == "fullbladeserver") {
                    let chassis = this.hardwareList.filter(c => c.id == hw.chassisid)[0];
                    if (chassis) {
                        hw.units.forEach(unit => {
                            chassis.childs[unit * 2 -1] = hw;
                            chassis.childs[unit * 2] = hw;
                        });
                    }
                    console.log(chassis.childs)
                }
                else if (hw.type == "halfbladeserver") {
                    let chassis = this.hardwareList.filter(c => c.id == hw.chassisid)[0];
                    if (chassis) {
                        hw.units.forEach(unit => {
                            let base = Number.parseInt(unit) * 2 - 1;
                            if (unit.toLowerCase().charAt(unit.length -1) == 'a') {
                                chassis.childs[base] = hw;
                            }
                            else 
                            if (unit.toLowerCase().charAt(unit.length - 1) == 'b') {
                                chassis.childs[base + 1] = hw;
                            }
                            
                        });
                    }
                    console.log(chassis.childs)
                }
            });
        }

        init(frontview) {
            console.log("builder initialize")

            this.frontview = document.getElementById(frontview);
            // this.rack = this.fetchRack();
            // this.hardwareList = this.fetchHardwareList();
            this.createUnitsMap();
        }

        getUnitNum(index) {
            let unitNum = document.createElement('div');
            unitNum.classList.add('unit-num');
            unitNum.innerText = index;

            return unitNum;
        }

        addUnitServer(item, index, view) {
            // rackObject = document.createElement('div');
            // rackObject.classList.add("rack-object")
            let rackObject = view;

            let hw = document.createElement('div');
            hw.classList.add("hardware");
            hw.innerText = "S " + item.id;
            let isize = item.size
            let serverSize = "server" + isize + "u";
            let gridSize = "size-" + isize + "u";
            hw.classList.add(serverSize);
            hw.classList.add(gridSize);

            // add hint
            let hint = document.createElement('span');
            hint.innerText = "Юнит: " + index + ", Сервер: S" + item.id;
            hint.classList.add("hw-tooltiptext");
            hw.classList.add("use-hint");
            hw.appendChild(hint);

            rackObject.appendChild(this.getUnitNum(index));
            rackObject.appendChild(hw);
            rackObject.appendChild(this.getUnitNum(index));
            while (isize-- > 1) {
                let idx = --index;
                rackObject.appendChild(this.getUnitNum(idx));
                rackObject.appendChild(this.getUnitNum(idx));
            }
        }

        addSwitch(item, index, view) {
            let rackObject = view;

            let hw = document.createElement('div');
            hw.classList.add("hardware");
            hw.innerText = "S " + item.id;
            let isize = item.size
            let switchSize = "switch" + isize + "u";
            let gridSize = "size-" + isize + "u";
            hw.classList.add(switchSize);
            hw.classList.add(gridSize);

            // add hint
            let hint = document.createElement('span');
            hint.innerText = "Юнит: " + index + ", Коммутатор: S" + item.id;
            hint.classList.add("hw-tooltiptext");
            hw.classList.add("use-hint");
            hw.appendChild(hint);

            rackObject.appendChild(this.getUnitNum(index));
            rackObject.appendChild(hw);
            rackObject.appendChild(this.getUnitNum(index));
            while (isize-- > 1) {
                let idx = --index;
                rackObject.appendChild(this.getUnitNum(idx));
                rackObject.appendChild(this.getUnitNum(idx));
            }
        }

        addBladeChassis(item, index, view) {
            let rackObject = view;

            let unitNum = document.createElement('div');
            unitNum.classList.add('unit-num');
            unitNum.innerText = index;

            let hw = document.createElement('div');
            hw.classList.add("hardware");
            let isize = item.size
            let bladeSize = "blade-" + item.class + "-" + isize + "u";
            let gridSize = "size-" + isize + "u";
            hw.classList.add(bladeSize);
            hw.classList.add(gridSize);
            let chassisId = "chassis-" + item.id
            hw.classList.add(chassisId);

            // add hint
            // let hint = document.createElement('span');
            // hint.innerText = "Юнит: " + index + ", Blade-шасси: S" + item.id;
            // hint.classList.add("hw-tooltiptext");
            // hw.classList.add("use-hint");
            // hw.appendChild(hint);

            rackObject.appendChild(this.getUnitNum(index));
            rackObject.appendChild(hw);
            rackObject.appendChild(this.getUnitNum(index));
            while (isize-- > 1) {
                let idx = --index;
                rackObject.appendChild(this.getUnitNum(idx));
                rackObject.appendChild(this.getUnitNum(idx));
            }

            return hw;
        }

        addEmptyUnit(index, view) {
            let rackObject = view;

            let emptyUnit = document.createElement('div');
            let emptyClass = index % 2 == 0 ? "empty-unit-even" : "empty-unit-odd";
            emptyUnit.classList.add(emptyClass);

            rackObject.appendChild(this.getUnitNum(index));
            rackObject.appendChild(emptyUnit);
            rackObject.appendChild(this.getUnitNum(index));
        }

        addRackCover(title="", view) {
            let rackObject = view;
            let cover = document.createElement('div');
            cover.classList.add('rack-cover');
            cover.innerText = title;
            rackObject.appendChild(cover);
        }

        addBladeServers(item, chassis) {
            let rackObject = chassis;
            let container = document.createElement('div');
            let bladeClass = "blade-" + item.class + "-chassis-container";
            container.classList.add(bladeClass);
            rackObject.appendChild(container);

            for (let i = 1; i < item.childsize * 2 + 1; i++) {
                let blade = item.childs[i];
                console.log(item.childs)

                if (!blade) {
                    container.appendChild(this.addEmptyBladeSlot(item.class));
                    i++;
                }
                else if (blade.type == "fullbladeserver") {
                    let slot = blade.units[0];
                    let view = this.addFullBladeServer(blade, slot);
                    container.appendChild(view);
                    i++;
                }
                else if (blade.type == "halfbladeserver") {
                    let slot = blade.units[0];
                    let side = i % 2 == 0 ? "b" : "a";
                    let view = this.addHalfBladeServer(blade, side, slot);
                    container.appendChild(view);
                }
            }
        }

        addFullBladeServer(blade, slot) {
            let hw = document.createElement('div');
            hw.classList.add('blade-' + blade.class + '-fullbladeserver');
            hw.innerText = "S " + blade.id;
            
            // add hint
            let hint = document.createElement('span');
            hint.innerText = "Слот: " + slot + ", Blade-сервер: S" + blade.id;
            hint.classList.add("hw-tooltiptext");
            hw.classList.add("use-hint");
            hw.appendChild(hint);

            return hw;
        }

        addHalfBladeServer(blade, side, slot) {
            let hw = document.createElement('div');
            hw.classList.add('blade-' + blade.class + '-halfbladeserver-' + side);
            hw.innerText = "S " + blade.id;

            // add hint
            let hint = document.createElement('span');
            hint.innerText = "Слот: " + slot + ", Blade-сервер: S" + blade.id;
            hint.classList.add("hw-tooltiptext");
            hw.classList.add("use-hint");
            hw.appendChild(hint);

            return hw;
        }

        addEmptyBladeSlot(bladeClass) {
            let slot = document.createElement('div');
            slot.classList.add('blade-' + bladeClass + '-empty-slot');

            return slot;
        }

        createFrontView() {

            this.addRackCover(this.rack.name, this.frontview);

            for (let i = this.rack.size; i > 0;) {
                if (!this.unitsMap[i]) {
                    this.addEmptyUnit(i, this.frontview);
                    i = i - 1;
                    continue;
                }

                if (this.unitsMap[i].type == "switch") {
                    this.addSwitch(this.unitsMap[i], i, this.frontview);
                }
                else if (this.unitsMap[i].type == "unitserver") {
                    this.addUnitServer(this.unitsMap[i], i, this.frontview);
                }
                else if (this.unitsMap[i].type == "bladechassis") {
                    let chassis = this.addBladeChassis(this.unitsMap[i], i, this.frontview);
                    // get blade servers and add in current chassis;
                    this.addBladeServers(this.unitsMap[i], chassis);
                }

                i = i - this.unitsMap[i].size;
            }

            this.addRackCover("", this.frontview);

        }
    }
    return Builder;
}());

// end lib
// ---
// begin app

// example data
function fetchRack() {
    return JSON.parse(`{
        "room":"r08",
        "name":"RA03",
        "class":"units",
        "size":48
     }`);
}
// example data
function fetchHardwareList() {
    return JSON.parse(`
    [
        {
           "id":332,
           "type":"switch",
           "size":1,
           "units":[
              48
           ],
           "pdu":[
              "102/2/3",
              "202/2/1"
           ],
           "powerstate":1
        },
        {
           "id":455,
           "type":"unitserver",
           "size":1,
           "units":[
              47
           ],
           "pdu":[
              "102/2/2"
           ],
           "powerstate":0
        },
        {
           "id":443,
           "type":"unitserver",
           "size":1,
           "units":[
              46
           ],
           "pdu":[
              "102/2/2"
           ],
           "powerstate":1
        },
        {
           "id":345,
           "type":"unitserver",
           "size":1,
           "units":[
              41
           ],
           "pdu":[
              "202/2/1"
           ],
           "powerstate":1
        },
        {
           "id":346,
           "type":"unitserver",
           "size":1,
           "units":[
              40
           ],
           "pdu":[
              "102/2/2"
           ],
           "powerstate":1
        },
        {
           "id":352,
           "type":"unitserver",
           "size":1,
           "units":[
              39
           ],
           "pdu":[
              "102/2/3"
           ],
           "powerstate":1
        },
        {
           "id":349,
           "type":"unitserver",
           "size":2,
           "units":[
              37,
              38
           ],
           "pdu":[
              "102/2/1",
              "202/2/3"
           ],
           "powerstate":1
        },
        {
           "id":367,
           "type":"unitserver",
           "size":1,
           "units":[
              36
           ],
           "pdu":[
              "102/2/1"
           ],
           "powerstate":1
        },
        {
           "id":384,
           "type":"unitserver",
           "size":1,
           "units":[
              29
           ],
           "pdu":[
              "102/2/1"
           ],
           "powerstate":0
        },
        {
           "id":392,
           "type":"unitserver",
           "size":1,
           "units":[
              28
           ],
           "pdu":[
              "102/2/1"
           ],
           "powerstate":1
        },
        {
           "id":436,
           "type":"unitserver",
           "size":1,
           "units":[
              27
           ],
           "pdu":[
              "102/2/1"
           ],
           "powerstate":1
        },
        {
           "id":524,
           "type":"unitserver",
           "size":2,
           "units":[
              25,
              26
           ],
           "pdu":[
              "102/2/1"
           ],
           "powerstate":1
        },
        {
           "id":421,
           "type":"unitserver",
           "size":1,
           "units":[
              24
           ],
           "pdu":[
              "202/2/2"
           ],
           "powerstate":1
        },
        {
           "id":101,
           "type":"unitserver",
           "size":1,
           "units":[
              23
           ],
           "pdu":[
              "202/2/1"
           ],
           "powerstate":1
        },
        {
           "id":311,
           "type":"unitserver",
           "size":1,
           "units":[
              22
           ],
           "pdu":[
              "102/2/3"
           ],
           "powerstate":1
        },
        {
           "id":552,
           "type":"bladechassis",
           "class":"hp-c7000",
           "size":10,
           "childsize":16,
           "units":[
              1,
              2,
              3,
              4,
              5,
              6,
              7,
              8,
              9,
              10
           ],
           "pdu":[
              "102/2/1",
              "102/2/3",
              "202/2/1",
              "202/2/3"
           ],
           "powerstate":1
        },
        {
           "id":495,
           "type":"fullbladeserver",
           "class":"hp-c7000",
           "chassisid":552,
           "size":2,
           "units":[
              1
           ],
           "pdu":[
              
           ],
           "powerstate":1
        },
        {
           "id":496,
           "type":"fullbladeserver",
           "class":"hp-c7000",
           "chassisid":552,
           "size":2,
           "units":[
              3
           ],
           "pdu":[
              
           ],
           "powerstate":1
        },
        {
           "id":497,
           "type":"fullbladeserver",
           "class":"hp-c7000",
           "chassisid":552,
           "size":2,
           "units":[
              5
           ],
           "pdu":[
              
           ],
           "powerstate":1
        },
        {
           "id":440,
           "type":"halfbladeserver",
           "class":"hp-c7000",
           "chassisid":552,
           "size":1,
           "units":[
              "9b"
           ],
           "pdu":[
              
           ],
           "powerstate":0
        },
        {
           "id":437,
           "type":"halfbladeserver",
           "class":"hp-c7000",
           "chassisid":552,
           "size":1,
           "units":[
              "8a"
           ],
           "pdu":[
              
           ],
           "powerstate":1
        },
        {
           "id":439,
           "type":"halfbladeserver",
           "class":"hp-c7000",
           "chassisid":552,
           "size":1,
           "units":[
              "9a"
           ],
           "pdu":[
              
           ],
           "powerstate":0
        },
        {
           "id":519,
           "type":"halfbladeserver",
           "class":"hp-c7000",
           "chassisid":552,
           "size":1,
           "units":[
              "11a"
           ],
           "pdu":[
              
           ],
           "powerstate":1
        },
        {
           "id":520,
           "type":"halfbladeserver",
           "class":"hp-c7000",
           "chassisid":552,
           "size":1,
           "units":[
              "11b"
           ],
           "pdu":[
              
           ],
           "powerstate":1
        },
        {
            "id":438,
            "type":"halfbladeserver",
            "class":"hp-c7000",
            "chassisid":552,
            "size":1,
            "units":[
               "8b"
            ],
            "pdu":[
               
            ],
            "powerstate":1
         }
     ]
    `);
}

rack = fetchRack();
hardwareList = fetchHardwareList();

let builder = new RackBuilder(rack, hardwareList);
builder.init("frontview");
builder.createFrontView();

// end app