// I wanted to emulate the colours used in ggplot2. Unfortunately, the colour
// models used in D3 do not allow this, so I copied these functions from the R
// source code, complete with all their magic numbers. I do not know how this is
// working! https://goo.gl/dzvmRC

var gtrans = function(u)
{
    if (u > 0.00304) {
        return 1.055 * Math.pow(u, (1 / 2.4)) - 0.055;}
    else {
        return 12.92 * u;}
}

var hcl2rgb = function(h, c, l)
{
    if (l <= 0.0) {
        return d3.rgb(0,0,0);}
    // Step 1 : Convert to CIE-LUV
    var L = l;
    var U = c * Math.cos( (Math.PI*h)/180 );
    var V = c * Math.sin( (Math.PI*h)/180 );
    // Step 2 : Convert to CIE-XYZ
    if (L <= 0 && U == 0 && V == 0) {
        var X = 0;
        var Y = 0;
        var Z = 0;}
    else {
        if (L > 7.999592) {
            var Y = 100 * Math.pow((L + 16)/116, 3)}
        else {
            var Y = 100 * (L / 903.3)}
        var u = U / (13 * L) + 0.1978398;
        var v = V / (13 * L) + 0.4683363;
        var X =  9.0 * Y * u / (4 * v);
        var Z =  - X / 3 - 5 * Y + 3 * Y / v;}
    // Step 4 : CIE-XYZ to sRGB
    var R = 255 * gtrans(( 3.240479*X-1.537150*Y-0.498535*Z)/100)+0.5;
    var G = 255 * gtrans((-0.969256*X+1.875992*Y+0.041556*Z)/100)+0.5;
    var B = 255 * gtrans(( 0.055648*X-0.204043*Y+1.057311*Z)/100)+0.5;
    if (R>255){R=255}
    if (G>255){G=255}
    if (B>255){B=255}
    if (R<0){R=0}
    if (G<0){G=0}
    if (B<0){B=0}
    return d3.rgb(R,G,B);
}
