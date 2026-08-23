const fs = require('fs');
const filePath = '/home/z/my-project/src/components/MainApp.tsx';
let code = fs.readFileSync(filePath, 'utf-8');

// Fix 1: Close the desktop table wrapper div
// The original was: <div className="hidden md:block..."> 
// We changed it to: {pmMainTab !== 'Rekapitulasi' && <div className="hidden md:block...">
// The closing </div> for the desktop table needs )} after it
// Find the pattern: </div>\n\n            {/* MOBILE: CARD VIEW
const old1 = `</div>

            {/* MOBILE: CARD VIEW (hidden on desktop) */}`;
const new1 = `) : null}

            {/* MOBILE: CARD VIEW (hidden on desktop) */}`;
code = code.replace(old1, new1);

// Fix 2: Close the mobile cards wrapper div
// The closing </div> before </div>\n          </div>\n        );
const old2 = `            </div>
          </div>
        );`;
const new2 = `) : null}
          </div>
        );`;
code = code.replace(old2, new2);

fs.writeFileSync(filePath, code, 'utf-8');
console.log('OK - closing tags fixed');
