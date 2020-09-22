// begin lib
var RackBuilder = (function namespace() {

   class RackBuilder {

      constructor(rack, hardwareList) {
         this.rack = rack;
         this.hardwareList = hardwareList;
         this.frontview = null;
         this.rackcase = null;
         this.unitsMap = null;
      }

      init(frontview, rackcase) {
         this.frontview = document.getElementById(frontview);
         this.rackcase = document.getElementById(rackcase);

         this.createUnitsMap();
      }

      prepareFrontView() {
         this.frontview.classList.add(this.rack.type + "-view");
         this.rackcase.classList.add(this.rack.type + "-case-" + this.rack.size);
         let lcol = this.rackcase.getElementsByClassName("index-col-left")[0];
         let rcol = this.rackcase.getElementsByClassName("index-col-right")[0];
         let rheader = this.rackcase.getElementsByClassName("rack-header")[0];
         rheader.innerText = this.rack.name;
         this.formatRackCase(lcol, rcol);
      }

      addEmptyUnit(index, view) {
         let rackObject = view;

         let emptyUnit = document.createElement('div');
         let emptyClass = index % 2 == 0 ? this.rack.type + "-empty-even" : this.rack.type + "-empty-odd";
         emptyUnit.classList.add(emptyClass);

         rackObject.appendChild(emptyUnit);
      }

      getUnitNum(index) {
         let unitNum = document.createElement('div');
         unitNum.classList.add('unit-num');
         unitNum.innerText = index;

         return unitNum;
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
            let resClass = 'hw-ctr-' + size * 24;
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
         else if (type == "tower") {
            let resClass = 'tower-hw-ctr-' + size;
            c.classList.add(resClass);
         }

         return c;
      }

      createDiskDriveContainer(size, maxdrive) {
         let c = document.createElement('div');
         let resClass = this.rack.type + "-disk-ctr-" + size + "-" + maxdrive;

         c.classList.add(resClass);
         return c;
      }

      getDiskDrive(type, capacity) {
         let d = document.createElement('div');
         let resClass = "disk-" + type;
         d.innerText = capacity;

         d.classList.add(resClass);
         return d;
      }

      addHardDrives(srv, sctr) {
         let drives = srv.drives;

         if (drives.length > 0) {
            let ctr = this.createDiskDriveContainer(srv.size, srv.maxdrive);
            drives.forEach(drive => {
               ctr.appendChild(this.getDiskDrive(drive.type, drive.capacity));
            });
            sctr.appendChild(ctr);
         }
      }

      getItemHint(item, title) {
         let hint = document.createElement('div');
         hint.classList.add("hw-tooltiptext");

         let str1 = document.createElement('div');
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

      addHint(obj, data, title) {
         let hint = this.getItemHint(data, title);
         obj.classList.add("use-hint");
         obj.appendChild(hint);
      }

   }

   class TowerRackBuilder extends RackBuilder {

      parseUnit(unitstr) {
         return unitstr.split("/").map(x => +x);
      }

      formatRackCase(lcol, rcol) {
         for (let idx = this.rack.size / 5; idx > 0; idx--) {
            lcol.appendChild(this.getUnitNum(idx));
            rcol.appendChild(this.getUnitNum(idx));
         }
      }

      createUnitsMap() {
         this.unitsMap = new Array(this.rack.size + 1);
         // let rack_index = this.rack.name.split(" ")[1]

         this.hardwareList.forEach(hw => {
            hw.units.forEach(unit => {
               if (hw.type == "tower") {
                  let unitarr = this.parseUnit(unit);
                  // if (unitarr[0] == rack_index) {
                     let pos = unitarr[1] * 5 + 6 - unitarr[2];
                     this.unitsMap[pos] = hw;
                  // }
               }
            });
         });
      }

      addTower(tower, index, view) {
         let rackObject = view;

         let srv = document.createElement('div');
         let srvClass = "t-server-" + tower.powerstate;
         srv.classList.add(srvClass);
         // srv.innerText = "S" + tower.id;

         let hwCtr = this.getHardwareInnerViewContainer(tower.type,tower.size);
         srv.appendChild(hwCtr);

         // add title
         hwCtr.appendChild(this.getHardwareTitle(tower.id));

         this.addHardDrives(tower, hwCtr);

         this.addHint(srv, tower, "Место: " + tower.units[0] + "; Сервер: S" + tower.id);

         rackObject.appendChild(srv);
      }

      
      createFrontView() {
         this.prepareFrontView();
         for (let i = this.rack.size; i > 0;) {
            if (!this.unitsMap[i]) {
               this.addEmptyUnit(i, this.frontview);
               i = i - 1;
               continue;
            }

            if (this.unitsMap[i].type == "tower") {
               this.addTower(this.unitsMap[i], i, this.frontview);
            }

            i = i - this.unitsMap[i].size;
         }
      }

   }

   class UnitsRackBuilder extends RackBuilder {

      formatRackCase(lcol, rcol) {
         for (let idx = this.rack.size; idx > 0; idx--) {
            lcol.appendChild(this.getUnitNum(idx));
            rcol.appendChild(this.getUnitNum(idx));
         }
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
                     if (unit.toLowerCase().charAt(unit.length - 1) == 'a') {
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

      addUnitServer(item, index, view) {
         // rackObject = document.createElement('div');
         // rackObject.classList.add("rack-object")
         let rackObject = view;

         let hw = document.createElement('div');
         hw.classList.add("hardware");
         hw.classList.add("units");
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

         this.addHardDrives(item, hwCtr);

         // add hint
         let unitsstr = index;
         if (item.size > 1) {
            let pos = index;
            for (let i = item.size; i > 1; i--) {
               unitsstr += "," + --pos;
            }
         }

         this.addHint(hw, item, "Юнит: " + unitsstr + "; Сервер: S" + item.id);

         rackObject.appendChild(hw);
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

         this.addHint(hw, item, "Юнит: " + unitsstr + "; Коммутатор: S" + item.id);
         rackObject.appendChild(hw);
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
         rackObject.appendChild(hw);

         return hw;
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

         this.addHardDrives(blade, hwCtr);

         // add hint
         let hint = this.getItemHint(blade, "Слот: " + slot + ", Blade-сервер: S" + blade.id);
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

         this.addHardDrives(blade, hwCtr);
         this.addHint(hw, blade, "Слот: " + slot + ", Blade-сервер: S" + blade.id);
         return hw;
      }

      addEmptyBladeSlot(bladeClass) {
         let slot = document.createElement('div');
         slot.classList.add('blade-' + bladeClass + '-empty-slot');

         return slot;
      }

      createFrontView() {
         this.prepareFrontView();

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
               this.addBladeServers(this.unitsMap[i], chassis);
            }

            i = i - this.unitsMap[i].size;
         }
      }
   }

   const builderFactory = {
      create: function (type) {
         switch (type.toLowerCase()) {
            case "units":
               return UnitsRackBuilder;
            case "towers":
               return TowerRackBuilder;
            default:
               return null;
         }
      }
   }

   return builderFactory;
}());
// end lib

function fetchRack() {
   return JSON.parse(`{"name":"RA01","type":"units","size":48,"switch": [101]}`);
}

function fetchHardwareList() {
   return JSON.parse(`[{"id":82,"units":[37],"size":1,"powerstate":1,"type":"unitserver","drives":[{"type":"sata-hdd","capacity":"1t"},{"type":"sata-hdd","capacity":"1t"}],"maxdrive":2},{"id":81,"units":[29],"size":1,"powerstate":1,"type":"unitserver","drives":[{"type":"sata-hdd","capacity":"1T"},{"type":"sata-hdd","capacity":"1T"},{"type":"sata-ssd","capacity":"256G"},{"type":"sata-ssd","capacity":"256G"}],"maxdrive":4},{"id":557,"units":[4,6,7,10,8,9,1,5,2,3],"size":10,"powerstate":0,"type":"bladechassis","class":"hp-c7000","childsize":16,"drives":[],"maxdrive":0},{"id":125,"units":[14],"size":1,"powerstate":0,"type":"fullbladeserver","class":"hp-c7000","chassisid":557,"drives":[{"type":"sas-hdd","capacity":"146G"}],"maxdrive":1},{"id":61,"units":[3],"size":1,"powerstate":1,"type":"fullbladeserver","class":"hp-c7000","chassisid":557,"drives":[{"type":"sas-hdd","capacity":"146g"},{"type":"sas-hdd","capacity":"146g"}],"maxdrive":2},{"id":124,"units":[13],"size":1,"powerstate":1,"type":"fullbladeserver","class":"hp-c7000","chassisid":557,"drives":[{"type":"sas-hdd","capacity":"146g"},{"type":"sas-hdd","capacity":"146g"}],"maxdrive":2},{"id":68,"units":[5],"size":1,"powerstate":1,"type":"fullbladeserver","class":"hp-c7000","chassisid":557,"drives":[{"type":"sata-hdd","capacity":"1t"},{"type":"sata-hdd","capacity":"1t"}],"maxdrive":2},{"id":1,"units":[7],"size":1,"powerstate":1,"type":"fullbladeserver","class":"hp-c7000","chassisid":557,"drives":[{"type":"sata-hdd","capacity":"1T"},{"type":"sata-hdd","capacity":"1T"}],"maxdrive":2},{"id":187,"units":[10],"size":2,"powerstate":1,"type":"fullbladeserver","class":"hp-c7000","chassisid":557,"drives":[{"type":"sas-hdd","capacity":"146 g"}],"maxdrive":1},{"id":72,"units":[12],"size":1,"powerstate":1,"type":"fullbladeserver","class":"hp-c7000","chassisid":557,"drives":[{"type":"sata-ssd","capacity":"480G"},{"type":"sata-ssd","capacity":"480G"}],"maxdrive":2},{"id":83,"units":[34],"size":1,"powerstate":0,"type":"unitserver","drives":[{"type":"sata-hdd","capacity":"1t"}],"maxdrive":1},{"id":94,"units":[32],"size":1,"powerstate":1,"type":"unitserver","drives":[{"type":"sas-hdd","capacity":"146g"},{"type":"sas-hdd","capacity":"300g"},{"type":"sata-hdd","capacity":"1t"},{"type":"sas-hdd","capacity":"300g"}],"maxdrive":4},{"id":484,"units":[48],"size":1,"powerstate":0,"type":"switch","drives":[],"maxdrive":0},{"id":10,"units":[38],"size":1,"powerstate":1,"type":"unitserver","drives":[{"type":"sata-hdd","capacity":"1t"},{"type":"sata-hdd","capacity":"1 t"}],"maxdrive":2},{"id":79,"units":[45],"size":1,"powerstate":1,"type":"unitserver","drives":[{"type":"sas-hdd","capacity":"600G"},{"type":"sas-hdd","capacity":"600G"}],"maxdrive":2},{"id":451,"units":[27],"size":1,"powerstate":0,"type":"unitserver","drives":[{"type":"sas-hdd","capacity":"146g"}],"maxdrive":1},{"id":139,"units":[16],"size":1,"powerstate":1,"type":"unitserver","drives":[{"type":"sata-hdd","capacity":"2t"},{"type":"sata-hdd","capacity":"1t"},{"type":"sata-hdd","capacity":"2t"}],"maxdrive":3},{"id":379,"units":[28],"size":1,"powerstate":1,"type":"unitserver","drives":[{"type":"sata-hdd","capacity":"8T"},{"type":"sata-hdd","capacity":"4T"},{"type":"sata-ssd","capacity":"120 G"}],"maxdrive":3},{"id":102,"units":[23],"size":1,"powerstate":1,"type":"unitserver","drives":[{"type":"sata-ssd","capacity":"256G"},{"type":"sata-ssd","capacity":"256G"}],"maxdrive":2},{"id":53,"units":[18],"size":1,"powerstate":1,"type":"unitserver","drives":[{"type":"sas-hdd","capacity":"300g"},{"type":"sas-hdd","capacity":"300g"}],"maxdrive":2},{"id":436,"units":[22],"size":1,"powerstate":1,"type":"unitserver","drives":[{"type":"sata-ssd","capacity":"1T"},{"type":"sata-ssd","capacity":"1T"}],"maxdrive":2},{"id":206,"units":[40],"size":1,"powerstate":1,"type":"unitserver","drives":[{"type":"sata-hdd","capacity":"1t"}],"maxdrive":1},{"id":105,"units":[36,35],"size":2,"powerstate":1,"type":"unitserver","drives":[{"type":"sata-hdd","capacity":"1t"},{"type":"sata-hdd","capacity":"1t"},{"type":"sata-hdd","capacity":"1t"},{"type":"sata-ssd","capacity":"1t"},{"type":"sata-hdd","capacity":"1T"}],"maxdrive":5},{"id":93,"units":[12],"size":1,"powerstate":1,"type":"unitserver","drives":[{"type":"sas-hdd","capacity":"600G"},{"type":"sata-ssd","capacity":"500G"},{"type":"sas-hdd","capacity":"600G"}],"maxdrive":3},{"id":92,"units":[31],"size":1,"powerstate":1,"type":"unitserver","drives":[{"type":"sata-hdd","capacity":"500 g"},{"type":"sata-hdd","capacity":"500 g"},{"type":"sata-hdd","capacity":"1t"}],"maxdrive":3},{"id":556,"units":[13],"size":1,"powerstate":1,"type":"unitserver","drives":[{"type":"sata-hdd","capacity":"2T"},{"type":"sata-hdd","capacity":"1T"}],"maxdrive":2},{"id":376,"units":[19],"size":1,"powerstate":1,"type":"unitserver","drives":[{"type":"sata-hdd","capacity":"1t"},{"type":"sata-ssd","capacity":"480G"},{"type":"sata-ssd","capacity":"1T"}],"maxdrive":3},{"id":309,"units":[43],"size":1,"powerstate":1,"type":"unitserver","drives":[],"maxdrive":0}]    `);
}

let rack = fetchRack();
let hardwareList = fetchHardwareList();

(function (builderClass) {
    let builder = new builderClass(rack, hardwareList);
    builder.init("frontview", "rackcase");
    builder.createFrontView();
})(RackBuilder.create(rack.type));