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
         let rack_index = this.rack.name.split(" ")[1]

         this.hardwareList.forEach(hw => {
            hw.units.forEach(unit => {
               if (hw.type == "tower") {
                  let unitarr = this.parseUnit(unit);
                  if (unitarr[0] == rack_index) {
                     let pos = unitarr[1] * 5 + 6 - unitarr[2];
                     this.unitsMap[pos] = hw;
                  }
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

         let hint = this.getItemHint(tower, "Место: " + tower.units[0] + "; Сервер: S" + tower.id);
         srv.classList.add("use-hint");
         srv.appendChild(hint);

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

         let hint = this.getItemHint(item, "Юнит: " + unitsstr + "; Сервер: S" + item.id);
         hw.classList.add("use-hint");
         hw.appendChild(hint);

         // rackObject.appendChild(this.getUnitNum(index));
         rackObject.appendChild(hw);
         // rackObject.appendChild(this.getUnitNum(index));
         // while (isize-- > 1) {
         //    let idx = --index;
         //    rackObject.appendChild(this.getUnitNum(idx));
         //    rackObject.appendChild(this.getUnitNum(idx));
         // }
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

         let hint = this.getItemHint(item, "Юнит: " + unitsstr + "; Коммутатор: S" + item.id);
         hw.classList.add("use-hint");
         hw.appendChild(hint);

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

         // add hint
         let hint = this.getItemHint(blade, "Слот: " + slot + ", Blade-сервер: S" + blade.id);
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
// ---
// begin app

// example data
function fetchRack(num) {
   if (num == 1) {
      return JSON.parse(`{
         "room":"110",
         "name":"RA03",
         "type":"units",
         "size":48,
         "switch": [103,163]
      }`);
   }
   else if (num == 2) {
      return JSON.parse(`{
         "room":"115",
         "name":"Стеллаж 7",
         "type":"towers",
         "size":30,
         "switch": [181]
      }`);
   }



}
// example data
//RA01
// function fetchHardwareListUnits() {
//    return JSON.parse(`[{"id":554,"units":[1,2,3,4,5,6],"size":6,"powerstate":0,"type":"unitserver","drives":[],"maxdrive":0},{"id":357,"units":[22],"size":1,"powerstate":0,"type":"unitserver","drives":[],"maxdrive":0},{"id":351,"units":[28],"size":1,"powerstate":0,"type":"unitserver","drives":[{"type":"sata-ssd","capacity":"92T"},{"type":"sata-ssd","capacity":"92T"},{"type":"sata-ssd","capacity":"92T"}],"maxdrive":3},{"id":337,"units":[21],"size":1,"powerstate":0,"type":"unitserver","drives":[{"type":"sas-hdd","capacity":"600G"},{"type":"sata-ssd","capacity":"800 G"},{"type":"sata-ssd","capacity":"800 G"},{"type":"sas-hdd","capacity":"600G"},{"type":"sas-hdd","capacity":"600G"},{"type":"sas-hdd","capacity":"600G"},{"type":"sas-hdd","capacity":"600G"},{"type":"sas-hdd","capacity":"600G"}],"maxdrive":8},{"id":352,"units":[26],"size":1,"powerstate":0,"type":"unitserver","drives":[{"type":"sata-ssd","capacity":"92T"},{"type":"sata-ssd","capacity":"92T"},{"type":"sata-ssd","capacity":"92T"}],"maxdrive":3},{"id":493,"units":[48],"size":1,"powerstate":0,"type":"switch","drives":[],"maxdrive":0},{"id":359,"units":[20],"size":1,"powerstate":0,"type":"unitserver","drives":[{"type":"sata-ssd","capacity":"92T"},{"type":"sata-ssd","capacity":"92T"},{"type":"sata-ssd","capacity":"92T"}],"maxdrive":3},{"id":433,"units":[25],"size":1,"powerstate":0,"type":"unitserver","drives":[{"type":"sata-ssd","capacity":"2T"}],"maxdrive":1},{"id":347,"units":[30],"size":1,"powerstate":0,"type":"unitserver","drives":[{"type":"sata-ssd","capacity":"92T"},{"type":"sata-ssd","capacity":"92T"},{"type":"sata-ssd","capacity":"92T"}],"maxdrive":3},{"id":563,"units":[40],"size":1,"powerstate":0,"type":"unitserver","drives":[{"type":"sata-hdd","capacity":"250G"}],"maxdrive":1},{"id":356,"units":[23],"size":1,"powerstate":0,"type":"unitserver","drives":[{"type":"sata-ssd","capacity":"92T"},{"type":"sata-ssd","capacity":"92T"},{"type":"sata-ssd","capacity":"92T"}],"maxdrive":3},{"id":355,"units":[24],"size":1,"powerstate":0,"type":"unitserver","drives":[{"type":"sata-ssd","capacity":"92T"},{"type":"sata-ssd","capacity":"92T"},{"type":"sata-ssd","capacity":"92T"}],"maxdrive":3},{"id":485,"units":[7,8],"size":2,"powerstate":0,"type":"switch","drives":[],"maxdrive":0},{"id":562,"units":[39],"size":1,"powerstate":0,"type":"unitserver","drives":[{"type":"sata-hdd","capacity":"250G"}],"maxdrive":1},{"id":336,"units":[11],"size":1,"powerstate":0,"type":"unitserver","drives":[{"type":"sas-hdd","capacity":"600G"},{"type":"sas-hdd","capacity":"600G"},{"type":"sas-hdd","capacity":"600G"},{"type":"sata-hdd","capacity":"8G"},{"type":"sas-hdd","capacity":"600G"},{"type":"sas-hdd","capacity":"600G"}],"maxdrive":6},{"id":531,"units":[14,15,16,17],"size":4,"powerstate":1,"type":"unitserver","drives":[],"maxdrive":0},{"id":364,"units":[38],"size":1,"powerstate":1,"type":"unitserver","drives":[{"type":"sata-ssd","capacity":"512G"},{"type":"sata-ssd","capacity":"512G"}],"maxdrive":2},{"id":487,"units":[47],"size":1,"powerstate":0,"type":"switch","drives":[],"maxdrive":0},{"id":343,"units":[29],"size":1,"powerstate":0,"type":"unitserver","drives":[{"type":"sata-ssd","capacity":"92T"},{"type":"sata-ssd","capacity":"92T"},{"type":"sata-ssd","capacity":"92T"}],"maxdrive":3},{"id":101,"units":[12],"size":1,"powerstate":0,"type":"unitserver","drives":[{"type":"sata-hdd","capacity":"1 t"}],"maxdrive":1},{"id":348,"units":[31],"size":1,"powerstate":0,"type":"unitserver","drives":[{"type":"sata-ssd","capacity":"92T"},{"type":"sata-ssd","capacity":"92T"},{"type":"sata-ssd","capacity":"92T"}],"maxdrive":3},{"id":553,"units":[34,35],"size":2,"powerstate":0,"type":"unitserver","drives":[],"maxdrive":0},{"id":350,"units":[33],"size":1,"powerstate":0,"type":"unitserver","drives":[{"type":"sata-ssd","capacity":"92T"},{"type":"sata-ssd","capacity":"92T"},{"type":"sata-ssd","capacity":"92T"}],"maxdrive":3},{"id":360,"units":[37,36],"size":2,"powerstate":0,"type":"unitserver","drives":[{"type":"sata-hdd","capacity":"8T"},{"type":"sata-hdd","capacity":"8T"},{"type":"sata-hdd","capacity":"8T"},{"type":"sata-hdd","capacity":"8T"},{"type":"sata-hdd","capacity":"8T"},{"type":"sata-hdd","capacity":"8T"},{"type":"sata-hdd","capacity":"8T"},{"type":"sata-hdd","capacity":"8T"},{"type":"sata-hdd","capacity":"1t"},{"type":"sata-hdd","capacity":"1t"}],"maxdrive":10},{"id":349,"units":[32],"size":1,"powerstate":0,"type":"unitserver","drives":[{"type":"sata-ssd","capacity":"92T"},{"type":"sata-ssd","capacity":"92T"},{"type":"sata-ssd","capacity":"92T"}],"maxdrive":3}]    `);
// }
function fetchHardwareListUnits() {
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

function fetchHardwareListTowers() {
   return JSON.parse(`
   [
       {
          "id":121,
          "type":"tower",
          "size":1,
          "units":[
             "7/0/1"
          ],
          "pdu":[
             "211/7/3"
          ],
          "maxdrive": 6,
          "drives":[
          ],
          "powerstate":1,
          "cross": [
          ]
       },
       {
         "id":122,
         "type":"tower",
         "size":1,
         "units":[
            "7/0/2"
         ],
         "pdu":[
            "211/7/3"
         ],
         "maxdrive": 6,
         "drives":[
         ],
         "powerstate":0,
         "cross": [
         ]
      },
      {
         "id":123,
         "type":"tower",
         "size":1,
         "units":[
            "7/0/3"
         ],
         "pdu":[
            "211/7/3"
         ],
         "maxdrive": 6,
         "drives":[
         ],
         "powerstate":1,
         "cross": [
         ]
      },
      {
         "id":124,
         "type":"tower",
         "size":1,
         "units":[
            "7/0/5"
         ],
         "pdu":[
            "211/7/3"
         ],
         "maxdrive": 6,
         "drives":[
         ],
         "powerstate":0,
         "cross": [
         ]
      },
      {
         "id":125,
         "type":"tower",
         "size":1,
         "units":[
            "7/1/2"
         ],
         "pdu":[
            "211/7/3"
         ],
         "maxdrive": 6,
         "drives":[
         ],
         "powerstate":0,
         "cross": [
         ]
      },
      {
         "id":126,
         "type":"tower",
         "size":1,
         "units":[
            "7/1/4"
         ],
         "pdu":[
            "211/7/3"
         ],
         "maxdrive": 6,
         "drives":[
         ],
         "powerstate":1,
         "cross": [
         ]
      },
      {
         "id":127,
         "type":"tower",
         "size":1,
         "units":[
            "7/2/1"
         ],
         "pdu":[
            "211/7/3"
         ],
         "maxdrive": 6,
         "drives":[
         ],
         "powerstate":1,
         "cross": [
         ]
      },
      {
         "id":128,
         "type":"tower",
         "size":1,
         "units":[
            "7/2/2"
         ],
         "pdu":[
            "211/7/3"
         ],
         "maxdrive": 6,
         "drives":[
         ],
         "powerstate":0,
         "cross": [
         ]
      },
      {
         "id":129,
         "type":"tower",
         "size":1,
         "units":[
            "7/3/3"
         ],
         "pdu":[
            "211/7/3"
         ],
         "maxdrive": 6,
         "drives":[
         ],
         "powerstate":1,
         "cross": [
         ]
      },
      {
         "id":130,
         "type":"tower",
         "size":1,
         "units":[
            "7/3/5"
         ],
         "pdu":[
            "211/7/3"
         ],
         "maxdrive": 6,
         "drives":[
         ],
         "powerstate":0,
         "cross": [
         ]
      },
      {
         "id":131,
         "type":"tower",
         "size":1,
         "units":[
            "7/5/1"
         ],
         "pdu":[
            "211/7/3"
         ],
         "maxdrive": 6,
         "drives":[
            {"type": "sata-ssd", "capacity": "500G"},
            {"type": "sata-hdd", "capacity": "1Tb"},
            {"type": "sata-ssd", "capacity": "500G"},
            {"type": "sata-hdd", "capacity": "1Tb"},
            {"type": "sata-ssd", "capacity": "500G"},
            {"type": "sata-hdd", "capacity": "1Tb"}
         ],
         "powerstate":1,
         "cross": [
         ]
      },
      {
         "id":132,
         "type":"tower",
         "size":1,
         "units":[
            "7/5/2"
         ],
         "pdu":[
            "211/7/3"
         ],
         "maxdrive": 6,
         "drives":[
            {"type": "sata-hdd", "capacity": "1Tb"}
         ],
         "powerstate":1,
         "cross": [
         ]
      },
      {
         "id":133,
         "type":"tower",
         "size":1,
         "units":[
            "7/5/3"
         ],
         "pdu":[
            "211/7/3"
         ],
         "maxdrive": 6,
         "drives":[
            {"type": "sata-ssd", "capacity": "500G"}
         ],
         "powerstate":1,
         "cross": [
         ]
      },
      {
         "id":134,
         "type":"tower",
         "size":1,
         "units":[
            "7/5/4"
         ],
         "pdu":[
            "211/7/3"
         ],
         "maxdrive": 6,
         "drives":[
            {"type": "sata-ssd", "capacity": "500G"},
            {"type": "sata-hdd", "capacity": "1Tb"}
         ],
         "powerstate":1,
         "cross": [
         ]
      },
      {
         "id":135,
         "type":"tower",
         "size":1,
         "units":[
            "7/5/5"
         ],
         "pdu":[
            "211/7/3"
         ],
         "maxdrive": 6,
         "drives":[
            {"type": "sata-ssd", "capacity": "500G"},
            {"type": "sata-hdd", "capacity": "1Tb"},
            {"type": "sata-ssd", "capacity": "500G"},
            {"type": "sata-hdd", "capacity": "1Tb"}
         ],
         "powerstate":1,
         "cross": [
         ]
      }
   ]
   `);
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


/*
Проверить вывод по каждой стойке
В towers исправить hint
Перенести hint в родительский класс
*/