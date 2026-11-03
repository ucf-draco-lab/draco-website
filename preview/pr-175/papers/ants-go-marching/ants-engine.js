/*
  Ant colony engine for /papers/ants-go-marching/.

  A JavaScript port of the NetLogo "Ants" model, the model the RAMPED teachers
  started from in Borowczak and Burrows (2019):
    Wilensky, U. (1997). NetLogo Ants model. Center for Connected Learning and
    Computer-Based Modeling, Northwestern University, Evanston, IL.
    http://ccl.northwestern.edu/netlogo/models/Ants
  The model is copyright 1997 Uri Wilensky and licensed under CC BY-NC-SA 3.0
  (https://creativecommons.org/licenses/by-nc-sa/3.0/). This file is an
  adaptation of that model and is shared under the same license.

  With every PD-challenge switch off, the engine follows NetLogo 7's own source
  for each primitive the model uses: the MersenneTwisterFast generator, the
  agentset "shufflerator" behind ask, nextInt/nextLong/nextDouble, the
  integer-degree trig tables, patch rounding, the bounded-world (box) rules for
  fd, can-move?, and patch-right-and-ahead, and diffuse with NetLogo's
  order-independent four-term sums. A seeded run therefore draws the same
  random numbers in the same order as NetLogo.

  The switches add one way of meeting each of the five challenges the teachers
  were given (the paper lists the challenges, not their solutions).

  Loads as a page script or inside a Web Worker; exports self.AntsEngine.
*/
(function (root) {
  "use strict";

  /* ------------------------------------------------ random numbers */

  // NetLogo's org.nlogo.api.MersenneTwisterFast (Sean Luke), integer for integer.
  var N = 624, M = 397;
  var MATRIX_A = 0x9908b0df | 0, UPPER = 0x80000000 | 0, LOWER = 0x7fffffff;

  function MT(seed) {
    this.mt = new Int32Array(N);
    this.mti = N + 1;
    this.setSeed(seed === undefined ? 0 : seed);
  }

  MT.prototype.setSeed = function (seed) {
    var mt = this.mt;
    mt[0] = seed | 0;
    for (var i = 1; i < N; i++) {
      var p = mt[i - 1];
      mt[i] = (Math.imul(1812433253, p ^ (p >>> 30)) + i) | 0;
    }
    this.mti = N;
  };

  MT.prototype.next32 = function () {
    var mt = this.mt, y, kk;
    if (this.mti >= N) {
      for (kk = 0; kk < N - M; kk++) {
        y = (mt[kk] & UPPER) | (mt[kk + 1] & LOWER);
        mt[kk] = mt[kk + M] ^ (y >>> 1) ^ ((y & 1) ? MATRIX_A : 0);
      }
      for (; kk < N - 1; kk++) {
        y = (mt[kk] & UPPER) | (mt[kk + 1] & LOWER);
        mt[kk] = mt[kk + (M - N)] ^ (y >>> 1) ^ ((y & 1) ? MATRIX_A : 0);
      }
      y = (mt[N - 1] & UPPER) | (mt[0] & LOWER);
      mt[N - 1] = mt[M - 1] ^ (y >>> 1) ^ ((y & 1) ? MATRIX_A : 0);
      this.mti = 0;
    }
    y = mt[this.mti++];
    y ^= y >>> 11;
    y ^= (y << 7) & 0x9d2c5680;
    y ^= (y << 15) & 0xefc60000;
    y ^= y >>> 18;
    return y | 0;
  };

  // nextInt(n), n < 2^22 (exact in doubles).
  MT.prototype.nextInt = function (n) {
    if ((n & -n) === n) return Math.floor(n * (this.next32() >>> 1) / 2147483648);
    var bits, val;
    do {
      bits = this.next32() >>> 1;
      val = bits % n;
    } while (bits - val + (n - 1) > 2147483647);
    return val;
  };

  // nextLong(n) for 0 < n < 2^26: bits = (y << 32 | z) >>> 1, val = bits mod n.
  var TWO31 = 2147483648;
  MT.prototype.nextLong = function (n) {
    for (;;) {
      var yu = this.next32() >>> 0, zu = this.next32() >>> 0, lo = zu >>> 1;
      var val = ((yu % n) * (TWO31 % n) + (lo % n)) % n;
      if (yu !== 0xffffffff) return val;
      // Only a top-word of all ones can overflow NetLogo's rejection test.
      var bits = BigInt(yu) * 2147483648n + BigInt(lo);
      if (bits - BigInt(val) + BigInt(n - 1) <= 9223372036854775807n) return val;
    }
  };

  MT.prototype.nextDouble = function () {
    var y = this.next32(), z = this.next32();
    return ((y >>> 6) * 134217728 + (z >>> 5)) / 9007199254740992;
  };

  /* ------------------------------------------------ trig and geometry */

  // NetLogo TrigTables: StrictMath sin/cos of integer degrees, |x| < 3.2e-15 set to 0.
  // Generated with Java 21 StrictMath; these literals round-trip exactly.
  var SIN = [0.0,0.01745240643728351,0.03489949670250097,0.052335956242943835,0.0697564737441253,0.08715574274765817,0.10452846326765347,0.12186934340514748,0.13917310096006544,0.15643446504023087,0.17364817766693033,0.1908089953765448,0.20791169081775934,0.224951054343865,0.24192189559966773,0.25881904510252074,0.27563735581699916,0.29237170472273677,0.3090169943749474,0.3255681544571567,0.3420201433256687,0.35836794954530027,0.374606593415912,0.39073112848927377,0.4067366430758002,0.42261826174069944,0.4383711467890774,0.45399049973954675,0.4694715627858908,0.48480962024633706,0.49999999999999994,0.5150380749100542,0.5299192642332049,0.5446390350150271,0.5591929034707469,0.573576436351046,0.5877852522924731,0.6018150231520483,0.6156614753256583,0.6293203910498374,0.6427876096865393,0.6560590289905073,0.6691306063588582,0.6819983600624985,0.6946583704589973,0.7071067811865475,0.7193398003386512,0.7313537016191705,0.7431448254773942,0.754709580222772,0.766044443118978,0.7771459614569709,0.788010753606722,0.7986355100472928,0.8090169943749475,0.8191520442889918,0.8290375725550417,0.838670567945424,0.8480480961564261,0.8571673007021123,0.8660254037844386,0.8746197071393957,0.8829475928589269,0.8910065241883678,0.898794046299167,0.9063077870366499,0.9135454576426009,0.9205048534524404,0.9271838545667874,0.9335804264972017,0.9396926207859083,0.9455185755993167,0.9510565162951535,0.9563047559630354,0.9612616959383189,0.9659258262890683,0.9702957262759965,0.9743700647852352,0.9781476007338056,0.981627183447664,0.984807753012208,0.9876883405951378,0.9902680687415704,0.992546151641322,0.9945218953682733,0.9961946980917455,0.9975640502598242,0.9986295347545738,0.9993908270190958,0.9998476951563913,1.0,0.9998476951563913,0.9993908270190958,0.9986295347545738,0.9975640502598242,0.9961946980917455,0.9945218953682733,0.9925461516413221,0.9902680687415704,0.9876883405951378,0.984807753012208,0.981627183447664,0.9781476007338057,0.9743700647852352,0.9702957262759965,0.9659258262890683,0.9612616959383189,0.9563047559630355,0.9510565162951536,0.9455185755993168,0.9396926207859084,0.9335804264972017,0.9271838545667874,0.9205048534524403,0.9135454576426009,0.90630778703665,0.8987940462991669,0.8910065241883679,0.8829475928589269,0.8746197071393959,0.8660254037844387,0.8571673007021123,0.8480480961564261,0.838670567945424,0.8290375725550417,0.8191520442889917,0.8090169943749475,0.7986355100472927,0.788010753606722,0.777145961456971,0.766044443118978,0.7547095802227721,0.7431448254773942,0.7313537016191706,0.7193398003386511,0.7071067811865476,0.6946583704589971,0.6819983600624986,0.6691306063588583,0.6560590289905073,0.6427876096865395,0.6293203910498374,0.6156614753256584,0.6018150231520482,0.5877852522924732,0.5735764363510459,0.5591929034707469,0.5446390350150273,0.5299192642332049,0.5150380749100544,0.49999999999999994,0.48480962024633717,0.4694715627858907,0.45399049973954686,0.4383711467890773,0.4226182617406995,0.40673664307580043,0.39073112848927377,0.37460659341591224,0.3583679495453002,0.3420201433256689,0.3255681544571566,0.3090169943749475,0.2923717047227366,0.2756373558169992,0.258819045102521,0.24192189559966773,0.2249510543438652,0.20791169081775931,0.19080899537654497,0.17364817766693028,0.15643446504023098,0.13917310096006533,0.12186934340514755,0.10452846326765373,0.0871557427476582,0.06975647374412552,0.05233595624294381,0.03489949670250114,0.01745240643728344,0.0,-0.017452406437283637,-0.0348994967025009,-0.052335956242943564,-0.06975647374412527,-0.08715574274765794,-0.1045284632676535,-0.12186934340514731,-0.13917310096006552,-0.15643446504023073,-0.17364817766693047,-0.19080899537654472,-0.2079116908177595,-0.22495105434386498,-0.2419218955996675,-0.2588190451025208,-0.275637355816999,-0.29237170472273677,-0.3090169943749473,-0.32556815445715676,-0.34202014332566866,-0.35836794954530043,-0.374606593415912,-0.39073112848927355,-0.4067366430758002,-0.4226182617406993,-0.43837114678907746,-0.4539904997395467,-0.46947156278589086,-0.48480962024633695,-0.5000000000000001,-0.5150380749100542,-0.5299192642332048,-0.5446390350150271,-0.5591929034707467,-0.5735764363510462,-0.587785252292473,-0.6018150231520484,-0.6156614753256582,-0.6293203910498376,-0.6427876096865393,-0.656059028990507,-0.6691306063588582,-0.6819983600624984,-0.6946583704589974,-0.7071067811865475,-0.7193398003386512,-0.7313537016191705,-0.7431448254773944,-0.754709580222772,-0.7660444431189779,-0.7771459614569706,-0.7880107536067221,-0.7986355100472928,-0.8090169943749473,-0.8191520442889916,-0.8290375725550418,-0.838670567945424,-0.848048096156426,-0.8571673007021121,-0.8660254037844385,-0.8746197071393959,-0.882947592858927,-0.8910065241883678,-0.8987940462991668,-0.90630778703665,-0.913545457642601,-0.9205048534524403,-0.9271838545667873,-0.9335804264972016,-0.9396926207859084,-0.9455185755993168,-0.9510565162951535,-0.9563047559630353,-0.9612616959383189,-0.9659258262890683,-0.9702957262759965,-0.9743700647852351,-0.9781476007338056,-0.981627183447664,-0.984807753012208,-0.9876883405951377,-0.9902680687415703,-0.9925461516413221,-0.9945218953682734,-0.9961946980917455,-0.9975640502598242,-0.9986295347545738,-0.9993908270190958,-0.9998476951563913,-1.0,-0.9998476951563913,-0.9993908270190958,-0.9986295347545738,-0.9975640502598243,-0.9961946980917455,-0.9945218953682734,-0.992546151641322,-0.9902680687415704,-0.9876883405951378,-0.9848077530122081,-0.9816271834476639,-0.9781476007338056,-0.9743700647852352,-0.9702957262759966,-0.9659258262890684,-0.9612616959383188,-0.9563047559630354,-0.9510565162951536,-0.945518575599317,-0.9396926207859083,-0.9335804264972017,-0.9271838545667874,-0.9205048534524405,-0.9135454576426011,-0.9063077870366498,-0.898794046299167,-0.891006524188368,-0.8829475928589271,-0.8746197071393956,-0.8660254037844386,-0.8571673007021123,-0.8480480961564261,-0.8386705679454243,-0.8290375725550416,-0.8191520442889918,-0.8090169943749476,-0.798635510047293,-0.7880107536067218,-0.7771459614569708,-0.7660444431189781,-0.7547095802227721,-0.7431448254773946,-0.7313537016191703,-0.7193398003386511,-0.7071067811865477,-0.6946583704589976,-0.6819983600624983,-0.6691306063588581,-0.6560590289905074,-0.6427876096865396,-0.6293203910498378,-0.6156614753256582,-0.6018150231520483,-0.5877852522924734,-0.5735764363510465,-0.5591929034707466,-0.544639035015027,-0.529919264233205,-0.5150380749100545,-0.5000000000000004,-0.4848096202463369,-0.4694715627858908,-0.45399049973954697,-0.4383711467890778,-0.4226182617406992,-0.40673664307580015,-0.3907311284892739,-0.37460659341591235,-0.35836794954530077,-0.3420201433256686,-0.3255681544571567,-0.3090169943749476,-0.29237170472273716,-0.27563735581699894,-0.2588190451025207,-0.24192189559966787,-0.22495105434386534,-0.20791169081775987,-0.19080899537654467,-0.1736481776669304,-0.15643446504023112,-0.13917310096006588,-0.12186934340514723,-0.10452846326765342,-0.08715574274765832,-0.06975647374412564,-0.05233595624294437,-0.034899496702500823,-0.01745240643728356];
  var COS = [1.0,0.9998476951563913,0.9993908270190958,0.9986295347545738,0.9975640502598242,0.9961946980917455,0.9945218953682733,0.992546151641322,0.9902680687415704,0.9876883405951378,0.984807753012208,0.981627183447664,0.9781476007338057,0.9743700647852352,0.9702957262759965,0.9659258262890683,0.9612616959383189,0.9563047559630354,0.9510565162951535,0.9455185755993168,0.9396926207859084,0.9335804264972017,0.9271838545667874,0.9205048534524404,0.9135454576426009,0.9063077870366499,0.898794046299167,0.8910065241883679,0.882947592858927,0.8746197071393957,0.8660254037844387,0.8571673007021123,0.848048096156426,0.838670567945424,0.8290375725550416,0.8191520442889918,0.8090169943749475,0.7986355100472928,0.7880107536067219,0.7771459614569709,0.766044443118978,0.754709580222772,0.7431448254773942,0.7313537016191705,0.7193398003386512,0.7071067811865476,0.6946583704589973,0.6819983600624985,0.6691306063588582,0.6560590289905073,0.6427876096865394,0.6293203910498375,0.6156614753256583,0.6018150231520483,0.5877852522924731,0.573576436351046,0.5591929034707468,0.5446390350150271,0.5299192642332049,0.5150380749100542,0.5000000000000001,0.4848096202463371,0.46947156278589086,0.45399049973954686,0.43837114678907746,0.42261826174069944,0.4067366430758002,0.3907311284892737,0.37460659341591196,0.3583679495453004,0.3420201433256688,0.32556815445715676,0.30901699437494745,0.29237170472273677,0.27563735581699916,0.25881904510252074,0.24192189559966767,0.22495105434386492,0.20791169081775945,0.19080899537654492,0.17364817766693041,0.15643446504023092,0.13917310096006547,0.12186934340514749,0.10452846326765346,0.08715574274765814,0.06975647374412523,0.052335956242943966,0.03489949670250108,0.0174524064372836,0.0,-0.017452406437283477,-0.034899496702500955,-0.05233595624294384,-0.06975647374412533,-0.08715574274765824,-0.10452846326765355,-0.12186934340514737,-0.13917310096006535,-0.1564344650402308,-0.1736481776669303,-0.1908089953765448,-0.20791169081775934,-0.22495105434386503,-0.24192189559966779,-0.25881904510252085,-0.27563735581699905,-0.29237170472273666,-0.30901699437494734,-0.32556815445715664,-0.3420201433256687,-0.35836794954530027,-0.37460659341591207,-0.39073112848927377,-0.40673664307580026,-0.42261826174069933,-0.4383711467890775,-0.45399049973954675,-0.4694715627858909,-0.484809620246337,-0.4999999999999998,-0.5150380749100543,-0.5299192642332048,-0.5446390350150271,-0.5591929034707467,-0.5735764363510462,-0.587785252292473,-0.6018150231520484,-0.6156614753256583,-0.6293203910498373,-0.6427876096865394,-0.6560590289905072,-0.6691306063588582,-0.6819983600624984,-0.6946583704589974,-0.7071067811865475,-0.7193398003386513,-0.7313537016191705,-0.7431448254773941,-0.754709580222772,-0.7660444431189779,-0.7771459614569709,-0.7880107536067219,-0.7986355100472929,-0.8090169943749473,-0.8191520442889919,-0.8290375725550416,-0.8386705679454239,-0.848048096156426,-0.8571673007021122,-0.8660254037844387,-0.8746197071393957,-0.882947592858927,-0.8910065241883678,-0.898794046299167,-0.9063077870366499,-0.9135454576426008,-0.9205048534524404,-0.9271838545667873,-0.9335804264972017,-0.9396926207859083,-0.9455185755993168,-0.9510565162951535,-0.9563047559630355,-0.9612616959383189,-0.9659258262890682,-0.9702957262759965,-0.9743700647852351,-0.9781476007338057,-0.981627183447664,-0.984807753012208,-0.9876883405951377,-0.9902680687415704,-0.992546151641322,-0.9945218953682733,-0.9961946980917455,-0.9975640502598242,-0.9986295347545738,-0.9993908270190958,-0.9998476951563913,-1.0,-0.9998476951563913,-0.9993908270190958,-0.9986295347545738,-0.9975640502598242,-0.9961946980917455,-0.9945218953682733,-0.9925461516413221,-0.9902680687415703,-0.9876883405951378,-0.984807753012208,-0.981627183447664,-0.9781476007338056,-0.9743700647852352,-0.9702957262759966,-0.9659258262890683,-0.9612616959383189,-0.9563047559630354,-0.9510565162951536,-0.9455185755993167,-0.9396926207859084,-0.9335804264972017,-0.9271838545667874,-0.9205048534524404,-0.9135454576426009,-0.90630778703665,-0.8987940462991669,-0.8910065241883679,-0.8829475928589269,-0.8746197071393959,-0.8660254037844386,-0.8571673007021123,-0.8480480961564261,-0.838670567945424,-0.8290375725550418,-0.8191520442889918,-0.8090169943749475,-0.7986355100472928,-0.788010753606722,-0.7771459614569708,-0.7660444431189781,-0.7547095802227721,-0.7431448254773942,-0.7313537016191706,-0.7193398003386511,-0.7071067811865477,-0.6946583704589973,-0.6819983600624986,-0.6691306063588581,-0.6560590289905073,-0.6427876096865395,-0.6293203910498378,-0.6156614753256581,-0.6018150231520483,-0.5877852522924732,-0.5735764363510464,-0.5591929034707466,-0.544639035015027,-0.529919264233205,-0.5150380749100545,-0.5000000000000004,-0.48480962024633684,-0.46947156278589075,-0.4539904997395469,-0.43837114678907774,-0.42261826174069916,-0.4067366430758001,-0.3907311284892738,-0.3746065934159123,-0.3583679495453007,-0.34202014332566855,-0.32556815445715664,-0.30901699437494756,-0.2923717047227371,-0.2756373558169989,-0.25881904510252063,-0.24192189559966779,-0.22495105434386525,-0.2079116908177598,-0.1908089953765446,-0.17364817766693033,-0.15643446504023104,-0.13917310096006583,-0.12186934340514717,-0.10452846326765336,-0.08715574274765825,-0.06975647374412558,-0.052335956242944306,-0.03489949670250076,-0.017452406437283498,0.0,0.01745240643728313,0.03489949670250128,0.052335956242943946,0.06975647374412522,0.08715574274765789,0.10452846326765299,0.12186934340514768,0.13917310096006547,0.15643446504023067,0.17364817766692997,0.1908089953765451,0.20791169081775943,0.22495105434386492,0.24192189559966745,0.2588190451025203,0.2756373558169994,0.2923717047227367,0.30901699437494723,0.3255681544571563,0.342020143325669,0.3583679495453004,0.37460659341591196,0.3907311284892735,0.40673664307579976,0.4226182617406996,0.4383711467890774,0.45399049973954664,0.4694715627858904,0.4848096202463373,0.5000000000000001,0.5150380749100542,0.5299192642332047,0.5446390350150266,0.559192903470747,0.573576436351046,0.5877852522924729,0.6018150231520479,0.6156614753256585,0.6293203910498375,0.6427876096865393,0.656059028990507,0.6691306063588578,0.6819983600624986,0.6946583704589973,0.7071067811865474,0.7193398003386509,0.7313537016191707,0.7431448254773942,0.7547095802227719,0.7660444431189778,0.7771459614569706,0.788010753606722,0.7986355100472928,0.8090169943749473,0.8191520442889916,0.8290375725550418,0.838670567945424,0.8480480961564258,0.8571673007021121,0.8660254037844384,0.8746197071393959,0.882947592858927,0.8910065241883678,0.8987940462991668,0.90630778703665,0.913545457642601,0.9205048534524403,0.9271838545667873,0.9335804264972015,0.9396926207859084,0.9455185755993168,0.9510565162951535,0.9563047559630353,0.9612616959383189,0.9659258262890683,0.9702957262759965,0.9743700647852351,0.9781476007338056,0.981627183447664,0.984807753012208,0.9876883405951377,0.9902680687415703,0.9925461516413221,0.9945218953682733,0.9961946980917455,0.9975640502598242,0.9986295347545738,0.9993908270190958,0.9998476951563913];

  function wrapHeading(h) {
    return (h < 0 || h >= 360) ? ((h % 360) + 360) % 360 : h;
  }

  // NetLogo DimensionManagement.wrapAndRound (after the box-topology bounds check).
  function roundCoord(x) {
    if (x > 0) return Math.trunc(x + 0.5);
    var ip = Math.trunc(x), fp = ip - x;
    return fp > 0.5 ? ip - 1 : ip;
  }

  // NetLogo Topology.sum4: (two lowest) + (two highest), independent of argument order.
  function sum4(a, b, c, d) {
    var low1, high1, low2, high2;
    if (a < b) { low1 = a; high1 = b; } else { low1 = b; high1 = a; }
    if (c < d) { low2 = c; high2 = d; } else { low2 = d; high2 = c; }
    if ((low2 < high1) && (low1 < high2)) return (low1 + low2) + (high1 + high2);
    return (low1 + high1) + (low2 + high2);
  }

  /*
    diffuse / diffuse4 on a non-wrapping (box) world, exactly as NetLogo's
    Topology.diffuseCenter plus XBlocks, YBlocks, and Box.diffuseCorners.
    v is indexed [row * w + col]; NetLogo's own row order does not matter
    because every formula is symmetric in the two directions.
  */
  function diffuseBox(v, w, h, amount, fourWay, scratch) {
    scratch.set(v);
    var s = scratch, dirs = fourWay ? 4 : 8, x, y, i, old, sum;
    var lastX = w - 1, lastY = h - 1;
    function at(cx, cy) { return s[cy * w + cx]; }
    function put(cx, cy, oldVal, total) {
      var nv = oldVal + amount * (total / dirs - oldVal);
      if (nv !== oldVal) v[cy * w + cx] = nv;
    }
    // interior
    for (x = 1; x < lastX; x++) {
      for (y = 1; y < lastY; y++) {
        i = y * w + x;
        old = s[i];
        sum = sum4(s[i + 1], s[i - 1], s[i - w], s[i + w]);
        if (!fourWay) sum = sum + sum4(s[i + w + 1], s[i - w + 1], s[i + w - 1], s[i - w - 1]);
        put(x, y, old, sum);
      }
    }
    // left and right columns (XBlocks)
    for (y = 1; y < lastY; y++) {
      [[0, 1], [lastX, lastX - 1]].forEach(function (pair) {
        var bx = pair[0], ix = pair[1], o = at(bx, y);
        var t = sum4(at(bx, y - 1), at(bx, y + 1), at(ix, y), o);
        if (!fourWay) t = t + sum4(at(ix, y - 1), at(ix, y + 1), o, o);
        put(bx, y, o, t);
      });
    }
    // top and bottom rows (YBlocks)
    for (x = 1; x < lastX; x++) {
      [[0, 1], [lastY, lastY - 1]].forEach(function (pair) {
        var by = pair[0], iy = pair[1], o = at(x, by);
        var t = sum4(at(x - 1, by), at(x + 1, by), at(x, iy), o);
        if (!fourWay) t = t + sum4(at(x - 1, iy), at(x + 1, iy), o, o);
        put(x, by, o, t);
      });
    }
    // corners (Box)
    [[0, 0, 1, 1], [0, lastY, 1, lastY - 1], [lastX, 0, lastX - 1, 1], [lastX, lastY, lastX - 1, lastY - 1]]
      .forEach(function (c) {
        var cx = c[0], cy = c[1], ix = c[2], iy = c[3], o = at(cx, cy);
        var t = sum4(at(ix, cy), at(cx, iy), o, o);
        if (!fourWay) t = t + sum4(at(ix, iy), o, o, o);
        put(cx, cy, o, t);
      });
  }

  // Fast path for the 8-way case on large worlds (same arithmetic, no closures).
  function diffuse8Box(v, w, h, amount, s) {
    s.set(v);
    var lastX = w - 1, lastY = h - 1, x, y, i, o, t, nv;
    for (y = 1; y < lastY; y++) {
      i = y * w + 1;
      for (x = 1; x < lastX; x++, i++) {
        o = s[i];
        t = sum4(s[i + 1], s[i - 1], s[i - w], s[i + w]) +
            sum4(s[i + w + 1], s[i - w + 1], s[i + w - 1], s[i - w - 1]);
        nv = o + amount * (t / 8 - o);
        if (nv !== o) v[i] = nv;
      }
    }
    diffuseEdges8(v, w, h, amount, s);
  }

  function diffuseEdges8(v, w, h, amount, s) {
    var lastX = w - 1, lastY = h - 1, x, y, i, j, o, t, nv;
    for (y = 1; y < lastY; y++) {
      i = y * w;            // left column, inner neighbor at i + 1
      o = s[i];
      t = sum4(s[i - w], s[i + w], s[i + 1], o) + sum4(s[i - w + 1], s[i + w + 1], o, o);
      nv = o + amount * (t / 8 - o); if (nv !== o) v[i] = nv;
      j = y * w + lastX;    // right column, inner neighbor at j - 1
      o = s[j];
      t = sum4(s[j - w], s[j + w], s[j - 1], o) + sum4(s[j - w - 1], s[j + w - 1], o, o);
      nv = o + amount * (t / 8 - o); if (nv !== o) v[j] = nv;
    }
    for (x = 1; x < lastX; x++) {
      i = x;                // top row, inner neighbor at i + w
      o = s[i];
      t = sum4(s[i - 1], s[i + 1], s[i + w], o) + sum4(s[i + w - 1], s[i + w + 1], o, o);
      nv = o + amount * (t / 8 - o); if (nv !== o) v[i] = nv;
      j = lastY * w + x;    // bottom row, inner neighbor at j - w
      o = s[j];
      t = sum4(s[j - 1], s[j + 1], s[j - w], o) + sum4(s[j - w - 1], s[j - w + 1], o, o);
      nv = o + amount * (t / 8 - o); if (nv !== o) v[j] = nv;
    }
    var corners = [[0, 1, w], [lastX, -1, w], [lastY * w, 1, -w], [lastY * w + lastX, -1, -w]];
    for (var k = 0; k < 4; k++) {
      i = corners[k][0]; var dx = corners[k][1], dy = corners[k][2];
      o = s[i];
      t = sum4(s[i + dx], s[i + dy], o, o) + sum4(s[i + dx + dy], o, o, o);
      nv = o + amount * (t / 8 - o); if (nv !== o) v[i] = nv;
    }
  }

  /*
    NetLogo's shufflerator over agents 0..n-1 (ArrayAgentSet and TreeAgentSet
    share the algorithm). The draw that picks the next agent happens before the
    current agent runs, so random calls inside fn interleave exactly as in NetLogo.
  */
  function shuffleRun(rng, order, n, fn) {
    if (n <= 0) return;
    var copy = order, i = 0;
    function fetch() {
      if (i >= n) return -1;
      var out;
      if (i < n - 1) {
        var r = i + rng.nextInt(n - i);
        out = copy[r];
        copy[r] = copy[i];
      } else {
        out = copy[i];
      }
      i++;
      return out;
    }
    var cur = fetch();
    while (cur !== -1) {
      var nxt = fetch();
      fn(cur);
      cur = nxt;
    }
  }

  /* ------------------------------------------------ the colony */

  var MAXP = 35, MINP = -35, W = 71, H = 71, NP = W * H;
  var EDGE_HI = MAXP + 0.5, EDGE_LO = MINP - 0.5;
  var RED = 15, CARRY = 26;   // NetLogo red, and orange + 1

  // Food piles: the model's three, then two more for challenge 2.
  var PILES = [
    { x: 0.6 * MAXP, y: 0 },
    { x: -0.6 * MAXP, y: -0.6 * MAXP },
    { x: -0.8 * MAXP, y: 0.8 * MAXP },
    { x: 0.75 * MAXP, y: 0.75 * MAXP },
    { x: 0.2 * MAXP, y: -0.8 * MAXP }
  ];

  function pindex(px, py) { return (MAXP - py) * W + (px - MINP); }

  function patchAt(x, y) {
    if (x >= EDGE_HI || x < EDGE_LO || y >= EDGE_HI || y < EDGE_LO) return -1;
    return pindex(roundCoord(x), roundCoord(y));
  }

  // NetLogo Protractor.distance for a patch to (x, y): sqrt of the squared offsets.
  function patchDistance(px, py, x, y) {
    var dx = x - px, dy = y - py;
    return Math.sqrt(dx * dx + dy * dy);
  }

  var DEFAULTS = {
    population: 125,
    diffusion: 50,          // diffusion-rate slider, percent
    evaporation: 10,        // evaporation-rate slider, percent
    piles: 3,               // challenge 2 raises this to 5
    energy: false,          // challenge 3
    maxEnergy: 600,
    reproduction: false,    // challenge 4
    foodPerBirth: 2,
    mutation: false,        // challenge 5 (needs reproduction)
    wiggle: 40,             // the model's "random 40"
    mutationStep: 10,
    maxAnts: 600
  };

  function Colony(opts) {
    this.opt = {};
    var k;
    for (k in DEFAULTS) this.opt[k] = DEFAULTS[k];
    for (k in (opts || {})) this.opt[k] = opts[k];
    this.rng = new MT(0);
    this.chemical = new Float64Array(NP);
    this.scratch = new Float64Array(NP);
    this.food = new Int8Array(NP);
    this.nest = new Uint8Array(NP);
    this.nestScent = new Float64Array(NP);
    this.source = new Uint8Array(NP);
    this.patchOrder = new Int32Array(NP);
    this.ants = [];
    this.ticks = 0;
  }

  Colony.prototype.setOptions = function (opts) {
    for (var k in opts) this.opt[k] = opts[k];
  };

  // NetLogo setup, with the same random draws in the same order.
  Colony.prototype.setup = function (seed) {
    var o = this.opt, rng = this.rng, self = this, i;
    this.seed = seed | 0;
    rng.setSeed(this.seed);
    // clear-all
    this.chemical.fill(0); this.food.fill(0); this.nest.fill(0);
    this.nestScent.fill(0); this.source.fill(0);
    this.ants = [];
    this.ticks = 0;
    this.nextWho = 0;
    this.delivered = 0;
    this.births = 0;
    this.deaths = 0;
    this.history = [];
    // create-turtles population [ set size 2 set color red ]
    var pop = Math.max(0, Math.floor(o.population));
    for (i = 0; i < pop; i++) {
      rng.nextInt(14);                       // the random color NetLogo assigns first
      var heading = rng.nextInt(360);
      this.ants.push(this.makeAnt(0, 0, heading, o.wiggle, true));
    }
    var newOrder = new Int32Array(pop);
    for (i = 0; i < pop; i++) newOrder[i] = i;
    shuffleRun(rng, newOrder, pop, function () {});
    // setup-patches: ask patches [ setup-nest setup-food recolor-patch ]
    var npiles = Math.max(1, Math.min(PILES.length, o.piles | 0));
    var order = this.patchOrder;
    for (i = 0; i < NP; i++) order[i] = i;
    shuffleRun(rng, order, NP, function (p) {
      var px = (p % W) + MINP, py = MAXP - Math.floor(p / W);
      var d0 = patchDistance(px, py, 0, 0);
      self.nest[p] = d0 < 5 ? 1 : 0;
      self.nestScent[p] = 200 - d0;
      for (var k = 0; k < npiles; k++) {
        if (patchDistance(px, py, PILES[k].x, PILES[k].y) < 5) self.source[p] = k + 1;
      }
      if (self.source[p] > 0) self.food[p] = rng.nextInt(2) === 0 ? 1 : 2;
    });
    this.initialFood = this.pileFood();
    this.record();
  };

  Colony.prototype.makeAnt = function (x, y, heading, wiggle, initial) {
    return {
      who: this.nextWho++, x: x, y: y, heading: heading, carrying: false,
      energy: this.opt.maxEnergy, wiggle: wiggle, initial: !!initial, alive: true,
      trips: 0, last: null
    };
  };

  Colony.prototype.pileFood = function () {
    var out = [0, 0, 0, 0, 0];
    for (var p = 0; p < NP; p++) if (this.source[p]) out[this.source[p] - 1] += this.food[p];
    return out.slice(0, Math.max(1, Math.min(PILES.length, this.opt.piles | 0)));
  };

  Colony.prototype.record = function () {
    this.history.push({ t: this.ticks, food: this.pileFood(), ants: this.ants.length,
      carrying: this.ants.filter(function (a) { return a.carrying; }).length,
      wiggle: this.meanWiggle() });
  };

  Colony.prototype.meanWiggle = function () {
    if (!this.ants.length) return null;
    var s = 0;
    for (var i = 0; i < this.ants.length; i++) s += this.ants[i].wiggle;
    return s / this.ants.length;
  };

  Colony.prototype.chemAhead = function (a, angle) {
    var h = wrapHeading(a.heading + angle);
    var p = patchAt(a.x + SIN[h], a.y + COS[h]);
    return p < 0 ? 0 : this.chemical[p];
  };

  Colony.prototype.nestAhead = function (a, angle) {
    var h = wrapHeading(a.heading + angle);
    var p = patchAt(a.x + SIN[h], a.y + COS[h]);
    return p < 0 ? 0 : this.nestScent[p];
  };

  // One ant's turn inside "ask turtles". trace (optional) records the rule that fired.
  Colony.prototype.step = function (a, trace) {
    var o = this.opt, rng = this.rng, p = patchAt(a.x, a.y), t = trace;
    if (a.initial && a.who >= this.ticks) { if (t) t.rule = "waiting"; return; }
    if (t) { t.patch = p; t.chem = this.chemical[p]; t.food = this.food[p]; t.nest = !!this.nest[p];
      t.carrying = a.carrying; t.x0 = a.x; t.y0 = a.y; t.h0 = a.heading; }
    if (!a.carrying) {
      // look-for-food
      if (this.food[p] > 0) {
        a.carrying = true;
        this.food[p] -= 1;
        a.heading = wrapHeading(a.heading + 180);
        if (t) t.rule = "pickup";
      } else if (this.chemical[p] >= 0.05 && this.chemical[p] < 2) {
        var ahead = this.chemAhead(a, 0), right = this.chemAhead(a, 45), left = this.chemAhead(a, -45);
        if (t) { t.rule = "sniff-chemical"; t.sniff = [left, ahead, right]; }
        if (right > ahead || left > ahead) {
          if (right > left) a.heading = wrapHeading(a.heading + 45);
          else a.heading = wrapHeading(a.heading - 45);
          if (t) t.turn = right > left ? 45 : -45;
        } else if (t) t.turn = 0;
      } else if (t) {
        t.rule = this.chemical[p] >= 2 ? "strong-chemical" : "search";
      }
    } else {
      // return-to-nest
      if (this.nest[p]) {
        a.carrying = false;
        a.heading = wrapHeading(a.heading + 180);
        a.trips++;
        this.delivered++;
        if (t) t.rule = "dropoff";
        if (o.energy) a.energy = o.maxEnergy;
        if (o.reproduction) this.maybeHatch(a);
      } else {
        this.chemical[p] = this.chemical[p] + 60;
        var na = this.nestAhead(a, 0), nr = this.nestAhead(a, 45), nl = this.nestAhead(a, -45);
        if (t) { t.rule = "sniff-nest"; t.sniff = [nl, na, nr]; }
        if (nr > na || nl > na) {
          if (nr > nl) a.heading = wrapHeading(a.heading + 45);
          else a.heading = wrapHeading(a.heading - 45);
          if (t) t.turn = nr > nl ? 45 : -45;
        } else if (t) t.turn = 0;
      }
    }
    // wiggle
    var wv = a.wiggle | 0;
    var r1 = wv > 0 ? rng.nextLong(wv) : 0;
    a.heading = wrapHeading(a.heading + r1);
    var r2 = wv > 0 ? rng.nextLong(wv) : 0;
    a.heading = wrapHeading(a.heading - r2);
    var blocked = false;
    if (patchAt(a.x + SIN[a.heading], a.y + COS[a.heading]) < 0) {
      a.heading = wrapHeading(a.heading + 180);
      blocked = true;
    }
    if (t) { t.wiggle = [r1, r2]; t.blocked = blocked; }
    // fd 1 (a jump that would leave the world leaves the ant in place)
    var nx = a.x + SIN[a.heading], ny = a.y + COS[a.heading];
    if (!(nx >= EDGE_HI || nx < EDGE_LO || ny >= EDGE_HI || ny < EDGE_LO)) { a.x = nx; a.y = ny; }
    if (t) { t.x1 = a.x; t.y1 = a.y; t.h1 = a.heading; }
    // challenge 3: every step costs energy
    if (o.energy) {
      a.energy -= 1;
      if (a.energy <= 0) a.alive = false;
    }
  };

  // Challenge 4 (and 5): every foodPerBirth deliveries, the nest hatches an ant.
  Colony.prototype.maybeHatch = function (parent) {
    var o = this.opt;
    if (this.delivered % Math.max(1, o.foodPerBirth | 0) !== 0) return;
    if (this.ants.length + this.hatchQueue.length >= o.maxAnts) return;
    var w = parent.wiggle;
    if (o.mutation) {
      var m = this.rng.nextInt(3) - 1;             // one-of [-1 0 1] steps
      w = Math.max(0, Math.min(90, w + m * (o.mutationStep | 0)));
    }
    this.hatchQueue.push({ heading: this.rng.nextInt(360), wiggle: w });
  };

  // NetLogo go: ask turtles [...], diffuse, ask patches [evaporate], tick.
  Colony.prototype.go = function (traceWho) {
    var o = this.opt, rng = this.rng, ants = this.ants, self = this, n = ants.length, i;
    var trace = null;
    this.hatchQueue = [];
    var order = new Int32Array(n);
    for (i = 0; i < n; i++) order[i] = i;
    shuffleRun(rng, order, n, function (k) {
      var a = ants[k];
      var tr = (traceWho !== undefined && a.who === traceWho) ? {} : null;
      self.step(a, tr);
      if (tr) trace = tr;
    });
    if (o.energy) {
      var alive = [];
      for (i = 0; i < ants.length; i++) { if (ants[i].alive) alive.push(ants[i]); else this.deaths++; }
      this.ants = alive;
    }
    for (i = 0; i < this.hatchQueue.length; i++) {
      var h = this.hatchQueue[i];
      this.ants.push(this.makeAnt(0, 0, h.heading, h.wiggle, false));
      this.births++;
    }
    diffuse8Box(this.chemical, W, H, o.diffusion / 100, this.scratch);
    // ask patches [ set chemical chemical * (100 - evaporation-rate) / 100 ]: the
    // shuffle consumes NP - 1 draws; the update itself does not depend on order.
    var porder = this.patchOrder;
    for (i = 0; i < NP; i++) porder[i] = i;
    shuffleRun(rng, porder, NP, function () {});
    var keep = 100 - o.evaporation, chem = this.chemical;
    for (i = 0; i < NP; i++) chem[i] = chem[i] * keep / 100;
    this.ticks++;
    this.record();
    this.lastTrace = trace;
    return trace;
  };

  Colony.prototype.foodLeft = function () {
    var s = 0;
    for (var p = 0; p < NP; p++) s += this.food[p];
    return s;
  };

  // Ticks until each pile empties (null if it never does within maxTicks).
  Colony.prototype.runUntilEmpty = function (maxTicks) {
    var npiles = this.pileFood().length, cleared = new Array(npiles).fill(null), left = npiles;
    var f = this.pileFood();
    for (var k = 0; k < npiles; k++) if (f[k] === 0) { cleared[k] = 0; left--; }
    while (left > 0 && this.ticks < maxTicks) {
      this.go();
      f = this.history[this.history.length - 1].food;
      for (k = 0; k < npiles; k++) if (cleared[k] === null && f[k] === 0) { cleared[k] = this.ticks; left--; }
      if (this.history.length > 4000) this.history = this.history.slice(-2000);
    }
    return cleared;
  };

  root.AntsEngine = {
    MT: MT, SIN: SIN, COS: COS, sum4: sum4, roundCoord: roundCoord,
    diffuseBox: diffuseBox, diffuse8Box: diffuse8Box, shuffleRun: shuffleRun,
    Colony: Colony, DEFAULTS: DEFAULTS, PILES: PILES,
    W: W, H: H, MINP: MINP, MAXP: MAXP, NP: NP, pindex: pindex, patchAt: patchAt
  };
})(typeof self !== "undefined" ? self : this);
