// begin lib
var RackBuilder = (function namespace() {
    
    class Builder {
        constructor(rack, hardwareList) {
            this.rack = rack;
            this.hardwareList = hardwareList;
            this.frontview = null;
            this.unitsMap = null;
        }

      //   parse blade type depending on place
      //   parseBladeTypes() {

      //   }

        createUnitsMap() {
            this.unitsMap = new Array(this.rack.size + 1);
            this.hardwareList.forEach(hw => {
                hw.units.forEach(unit => {
                    if (hw.type == "switch" || hw.type == "unitserver") {
                        this.unitsMap[unit] = hw;
                    }
                    else if (hw.type == "bladechassis") {
                        this.unitsMap[unit] = hw;
                        let childsize = 0;
                        if (!hw.hasOwnProperty("childsize")) {
                           if (hw.class == "hp-c7000") {
                              hw.childsize = 16
                              childsize = hw.childsize * 2 + 1; 
                           }
                           else if (hw.class == "cisco-ucs") {
                              hw.childsize = 8
                              childsize = hw.childsize + 1;
                           }
                        }
                        hw.childs = new Array(childsize);
                    }
                });

                if (hw.type == "ucsbladeserver") {
                  let chassis = this.hardwareList.filter(c => c.id == hw.chassisid)[0];
                  if (chassis) {
                      hw.units.forEach(unit => {
                          chassis.childs[unit] = hw;
                      });
                  }
              } 
              else if (hw.type == "fullbladeserver") {
                    let chassis = this.hardwareList.filter(c => c.id == hw.chassisid)[0];
                    if (chassis) {
                        hw.units.forEach(unit => {
                            chassis.childs[unit * 2 - 1] = hw;
                            chassis.childs[unit * 2] = hw;
                        });
                    }
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
                }
            });
        }

        init(frontview) {
            console.log("builder initialize")

            this.frontview = document.getElementById(frontview);
            this.createUnitsMap();
        }

        getUnitNum(index) {
            let unitNum = document.createElement('div');
            unitNum.classList.add('unit-num');
            unitNum.innerText = index;

            return unitNum;
        }

        getDiskDrive(type, capacity) {
           let d = document.createElement('div');
           let resClass = "disk-" + type;
           d.innerText = capacity;

           d.classList.add(resClass);
           return d;
        }

        createDiskDriveContainer(size, maxdrive) {
         let c = document.createElement('div');
         let resClass = "disk-ctr-" + size + "-" + maxdrive;

         c.classList.add(resClass);
         return c;
        }

        getHardwareTitle(name) {
         let title = document.createElement('div');
         title.classList.add('hw-title');
         title.innerText = 'S' + name;
         return title;
        }

        getHardwareInnerViewContainer(type, size) {

           let c = document.createElement('div');
           if (type == "unitserver") {
            let resClass = 'hw-ctr-' + size*24;
            c.classList.add(resClass);
           }
           else if (type == "hp-c7000-bladeserver") {
            let resClass = 'blade-ctr-' + size;
            c.classList.add(resClass);
           }
           else if (type == "cisco-ucs-bladeserver") {
            let resClass = 'cisco-ucs-ctr-' + size;
            c.classList.add(resClass);
           }
           
           return c;
        }

        getItemHint(index, item, title) {
         let hint = document.createElement('div');
         hint.classList.add("hw-tooltiptext");
         
         let str1= document.createElement('div');
         str1.innerText = title;
         hint.appendChild(str1);

         if (item.drives.length > 0) {
            let str2 = document.createElement('div');
            let tmpstr = "Диски:<br>";
            item.drives.forEach(drive => { 
               tmpstr += drive.type + ' ' + drive.capacity + '<br>';
            });

            str2.innerHTML = tmpstr;
            hint.appendChild(str2);
         }

         return hint;
      }

        addUnitServer(item, index, view) {
            // rackObject = document.createElement('div');
            // rackObject.classList.add("rack-object")
            let rackObject = view;

            let hw = document.createElement('div');
            hw.classList.add("hardware");
            hw.id = "hw-" + item.id;
            
            let isize = item.size
            let serverSize = "server" + isize + "u-" + item.powerstate;
            let gridSize = "size-" + isize + "u";
            hw.classList.add(serverSize);
            hw.classList.add(gridSize);

            let hwCtr = this.getHardwareInnerViewContainer("unitserver", item.size);
            hw.appendChild(hwCtr);
            
            // add title
            hwCtr.appendChild(this.getHardwareTitle(item.id));

            // add drives
            let drives = item.drives;
            
            if (drives.length > 0) {
               let ctr = this.createDiskDriveContainer(item.size, item.maxdrive);
               drives.forEach(drive => { 
                  ctr.appendChild(this.getDiskDrive(drive.type, drive.capacity));
               });
               hwCtr.appendChild(ctr);
            }

            // add hint
            let unitsstr = index;
            if (item.size > 1) {
               let pos = index;
               for (let i = item.size; i > 1; i--) {
                  unitsstr += "," + --pos;
               }
            }

            let hint = this.getItemHint(index, item, "Юнит: " + unitsstr + "; Сервер: S" + item.id);
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
            let isize = item.size
            let switchSize = "switch" + isize + "u";
            let gridSize = "size-" + isize + "u";
            hw.classList.add(switchSize);
            hw.classList.add(gridSize);

            let hwCtr = this.getHardwareInnerViewContainer(item.size);
            hw.appendChild(hwCtr);
            
            // add title
            hwCtr.appendChild(this.getHardwareTitle(item.id));

            // add hint
            let unitsstr = index;
            if (item.size > 1) {
               let pos = index;
               for (let i = item.size; i > 1; i--) {
                  unitsstr += "," + --pos;
               }
            }

            let hint = this.getItemHint(index, item, "Юнит: " + unitsstr + "; Коммутатор: S" + item.id);
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

            if (item.class == "hp-c7000") {
               for (let i = 1; i < item.childsize * 2 + 1; i++) {
                  let blade = item.childs[i];

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
            } else if (item.class == "cisco-ucs") {
               for (let i = 1; i < item.childsize + 1; i++) {
                  let blade = item.childs[i];
                  if (!blade) {
                     container.appendChild(this.addEmptyBladeSlot(item.class));
                  }
                  else {
                     let slot = blade.units[0];
                     let view = this.addFullBladeServer(blade, slot);
                     container.appendChild(view);
                  }
               }

            }

        }

        addFullBladeServer(blade, slot) {
            let hw = document.createElement('div');
            hw.classList.add('blade-' + blade.class + '-' + blade.type + '-' + blade.powerstate);
            hw.classList.add('blade');
            hw.classList.add(blade.class)
            // hw.innerText = "S " + blade.id;
            
            let hwCtr = this.getHardwareInnerViewContainer(blade.class + "-bladeserver", blade.size);
            hw.appendChild(hwCtr);

            if (blade.class == "hp-c7000") {
               hwCtr.appendChild(document.createElement('div')); //empty row
            }
            // add title
            hwCtr.appendChild(this.getHardwareTitle(blade.id));

            // add drives
            let drives = blade.drives;
            
            if (drives.length > 0) {
               let ctr = this.createDiskDriveContainer(blade.size, blade.maxdrive);
               drives.forEach(drive => { 
                  ctr.appendChild(this.getDiskDrive(drive.type, drive.capacity));
               });
               hwCtr.appendChild(ctr);
            }

            // add hint
            let hint = this.getItemHint(slot, blade, "Слот: " + slot + ", Blade-сервер: S" + blade.id);
            hw.classList.add("use-hint");
            hw.appendChild(hint);

            return hw;
        }

        addHalfBladeServer(blade, side, slot) {
            let hw = document.createElement('div');
            hw.classList.add('blade-' + blade.class + '-halfbladeserver-' + side + '-' + blade.powerstate);
            hw.classList.add('blade');
            hw.classList.add(blade.class);
            
            let hwCtr = this.getHardwareInnerViewContainer(blade.class + "-bladeserver", blade.size);
            hw.appendChild(hwCtr);

            hwCtr.appendChild(document.createElement('div')); //empty row
            // add title
            hwCtr.appendChild(this.getHardwareTitle(blade.id));

            // add drives
            let drives = blade.drives;
            
            if (drives.length > 0) {
               let ctr = this.createDiskDriveContainer(blade.size, blade.maxdrive);
               drives.forEach(drive => { 
                  ctr.appendChild(this.getDiskDrive(drive.type, drive.capacity));
               });
               hwCtr.appendChild(ctr);
            }

            // add hint
            let hint = this.getItemHint(slot, blade, "Слот: " + slot + ", Blade-сервер: S" + blade.id);
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
        "room":"110",
        "name":"RA03",
        "type":"units",
        "size":48,
        "switch": [103,163]
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
           "maxdrive": 0,
           "drives":[
           ],
           "powerstate":1,
           "cross": [
              "Ethernet185/1/8 Крос №00296 s263:p1",
              "Ethernet185/1/13 Крос №00301 s555:p1"
           ]
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
           "maxdrive": 4,
           "drives":[
            {"type": "sata-ssd", "capacity": "120G"},
            {"type": "sata-hdd", "capacity": "1Tb"}
           ],
           "powerstate":0,
           "cross": [
            "p1 Mac: 00:25:90:00:fb:02 Крос №00477 Fex105:Ethernet105/1/31",
            "p2 Mac: 00:25:90:00:fb:03"
           ]
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
           "maxdrive": 4,
           "drives":[
            {"type": "sata-ssd", "capacity": "500G"}
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
           "maxdrive": 4,
           "drives":[
            {"type": "sata-hdd", "capacity": "1Tb"}
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
           "maxdrive": 4,
           "drives":[
            {"type": "sata-ssd", "capacity": "120G"}
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
           "maxdrive": 4,
           "drives":[
            {"type": "sata-hdd", "capacity": "1Tb"}
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
           "maxdrive": 8,
           "drives":[
            {"type": "sata-ssd", "capacity": "500G"},
            {"type": "sata-hdd", "capacity": "1Tb"},
            {"type": "sata-ssd", "capacity": "500G"},
            {"type": "sata-hdd", "capacity": "1Tb"},
            {"type": "sata-ssd", "capacity": "1Tb"},
            {"type": "sata-hdd", "capacity": "1Tb"},
            {"type": "sata-hdd", "capacity": "1Tb"},
            {"type": "sata-hdd", "capacity": "1Tb"}
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
           "maxdrive": 4,
           "drives":[
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
           "maxdrive": 4,
           "drives":[
         ],
           "powerstate":0
        },
        {
         "id":688,
         "type":"unitserver",
         "size":3,
         "units":[
            42,43,44
         ],
         "pdu":[
            "102/2/1"
         ],
         "maxdrive": 8,
         "drives":[
       ],
         "powerstate":1
      },
      {
         "id":689,
         "type":"unitserver",
         "size":4,
         "units":[
            31,32,33,34
         ],
         "pdu":[
            "102/2/1"
         ],
         "maxdrive": 12,
         "drives":[
       ],
         "powerstate":1
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
           "maxdrive": 4,
           "drives":[
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
           "maxdrive": 4,
           "drives":[
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
           "maxdrive": 4,
           "drives":[
         ],
           "powerstate":0
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
           "maxdrive": 4,
           "drives":[
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
           "maxdrive": 4,
           "drives":[
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
           "maxdrive": 4,
           "drives":[
         ],
           "powerstate":1
        },
        {
           "id":552,
           "type":"bladechassis",
           "class":"hp-c7000",
           "size":10,
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
           "maxdrive": 0,
           "drives":[
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
           "maxdrive": 2,
           "drives":[
            {"type": "sata-ssd", "capacity": "500G"},
            {"type": "sata-hdd", "capacity": "1Tb"}
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
           "maxdrive": 2,
           "drives":[
            {"type": "sas-hdd", "capacity": "146G"},
            {"type": "sas-ssd", "capacity": "480G"}
         ],
           "powerstate":0
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
           "maxdrive": 2,
           "drives":[
            {"type": "sata-ssd", "capacity": "500G"},
            {"type": "sata-ssd", "capacity": "500G"}
         ],
           "powerstate":1
        },
        {
         "id":536,
         "type":"fullbladeserver",
         "class":"hp-c7000",
         "chassisid":552,
         "size":2,
         "units":[
            6
         ],
         "pdu":[
            
         ],
         "maxdrive": 2,
         "drives":[
          {"type": "sata-hdd", "capacity": "500G"}
       ],
         "powerstate":0
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
           "maxdrive": 1,
           "drives":[
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
           "maxdrive": 1,
           "drives":[
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
           "maxdrive": 1,
           "drives":[
            {"type": "sata-ssd", "capacity": "500G"}
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
           "maxdrive": 1,
           "drives":[
         ],
           "powerstate":0
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
           "maxdrive": 1,
           "drives":[
            {"type": "sata-hdd", "capacity": "1Tb"}
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
            "maxdrive": 1,
            "drives":[
            ],
            "powerstate":1
         },
         {
            "id":554,
            "type":"bladechassis",
            "class":"cisco-ucs",
            "size":6,
            "units":[
               11,
               12,
               13,
               14,
               15,
               16
            ],
            "pdu":[
               "102/2/1",
               "102/2/3",
               "202/2/1",
               "202/2/3"
            ],
            "maxdrive": 0,
            "drives":[
          ],
            "powerstate":1
         },
         {
            "id":665,
            "type":"ucsbladeserver",
            "class":"cisco-ucs",
            "chassisid":554,
            "size":1,
            "units":[
               "1"
            ],
            "pdu":[
               
            ],
            "maxdrive": 2,
            "drives":[
               {"type": "sata-ssd", "capacity": "500G"},
               {"type": "sata-ssd", "capacity": "500G"}
            ],
            "powerstate":1
         },
         {
            "id":666,
            "type":"ucsbladeserver",
            "class":"cisco-ucs",
            "chassisid":554,
            "size":1,
            "units":[
               "2"
            ],
            "pdu":[
               
            ],
            "maxdrive": 2,
            "drives":[
               {"type": "sas-ssd", "capacity": "2Tb"}
            ],
            "powerstate":0
         },
         {
            "id":667,
            "type":"ucsbladeserver",
            "class":"cisco-ucs",
            "chassisid":554,
            "size":1,
            "units":[
               "5"
            ],
            "pdu":[
               
            ],
            "maxdrive": 2,
            "drives":[
               {"type": "sata-hdd", "capacity": "1Tb"},
               {"type": "sas-hdd", "capacity": "146G"}
            ],
            "powerstate":1
         }
         ,
         {
            "id":668,
            "type":"ucsbladeserver",
            "class":"cisco-ucs",
            "chassisid":554,
            "size":1,
            "units":[
               "7"
            ],
            "pdu":[
               
            ],
            "maxdrive": 2,
            "drives":[
            ],
            "powerstate":0
         },
         {
            "id":690,
            "type":"switch",
            "size":2,
            "units":[
               18,
               17
            ],
            "pdu":[
               "102/2/2",
               "202/2/3"
            ],
            "maxdrive": 0,
            "drives":[
            ],
            "powerstate":1
         }
     ]
    `);
}

let rack = fetchRack();
hardwareList = fetchHardwareList();


if (rack.type == "units") {
   let builder = new RackBuilder(rack, hardwareList);
   builder.init("frontview");
   builder.createFrontView();
} 
else if (rack.class == "towers") {
   // let builder = new TowerRackBuilder(rack, hardwareList);
}


// let rel = document.getElementById("reltest");

// rel.addEventListener("mouseover", function(e) {
//    // const parent = e.target.parentElement;
//    hw = document.getElementById('hw-443');
//    hw.classList.add('focus');
// });
   
// rel.addEventListener("mouseout", function(e) {
//    // e.target.classList.remove("active");
//    hw = document.getElementById('hw-443');
//    hw.classList.remove('focus');
// });

// let rel2 = document.getElementById("reltest2");

// rel2.addEventListener("mouseover", function(e) {
//    // const parent = e.target.parentElement;
//    hw = document.getElementById('hw-346');
//    hw.classList.add('focus');
// });
   
// rel2.addEventListener("mouseout", function(e) {
//    // e.target.classList.remove("active");
//    hw = document.getElementById('hw-346');
//    hw.classList.remove('focus');
// });

// end app