Buffer = require('buffer').Buffer

buf = new Buffer(4)
buf.writeUInt16(0xdead, 0, 'little')
buf.writeUInt16(0xdead, 1, 'big')

buf.writeUInt

b = new Buffer(2)
b.writeUInt8(1, 0, 'little')
b.writeUInt8(1, 1, 'big')


console.log b.toString('utf-8')[0].toString(2)
console.log(1.toString(2)[0])

