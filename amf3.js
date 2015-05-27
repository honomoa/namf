// Generated by CoffeeScript 1.6.3
(function() {
  var AMFContext, ASObject, ClassDefinition, Decoder, Encoder, Float, MAX_29B_INT, MIN_29B_INT, ObjectEncoding, REFERENCE_BIT, TYPE_ARRAY, TYPE_BOOL_FALSE, TYPE_BOOL_TRUE, TYPE_BYTEARRAY, TYPE_DATE, TYPE_INTEGER, TYPE_NULL, TYPE_NUMBER, TYPE_OBJECT, TYPE_STRING, TYPE_UNDEFINED, TYPE_XML, TYPE_XMLSTRING, typeOf,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Float = require('./util').Float;

  ObjectEncoding = {
    STATIC: 0x00,
    EXTERNAL: 0x01,
    DYNAMIC: 0x02,
    PROXY: 0x03
  };

  TYPE_UNDEFINED = 0x00;

  TYPE_NULL = 0x01;

  TYPE_BOOL_FALSE = 0x02;

  TYPE_BOOL_TRUE = 0x03;

  TYPE_INTEGER = 0x04;

  TYPE_NUMBER = 0x05;

  TYPE_STRING = 0x06;

  TYPE_XML = 0x07;

  TYPE_DATE = 0x08;

  TYPE_ARRAY = 0x09;

  TYPE_OBJECT = 0x0A;

  TYPE_XMLSTRING = 0x0B;

  TYPE_BYTEARRAY = 0x0C;

  REFERENCE_BIT = 0x01;

  MAX_29B_INT = 0x0FFFFFFF;

  MIN_29B_INT = -0x10000000;

  AMFContext = require('./context');

  ASObject = require('./messaging').ASObject;

  ClassDefinition = (function() {
    function ClassDefinition() {}

    ClassDefinition.prototype.initialize = function(alias) {
      this.alias = alias;
      return this.reference = null;
    };

    return ClassDefinition;

  })();

  Decoder = (function(_super) {
    __extends(Decoder, _super);

    Decoder.prototype.endian = 'big';

    Decoder.prototype.offset = 0;

    function Decoder(buffer, offset) {
      this.buffer = buffer;
      this.offset = offset != null ? offset : 0;
      this.referenceStrings = [];
    }

    Decoder.prototype.readValue = function() {
      var type, value;
      type = this.buffer.readUInt8(this.offset, this.endian);
      this.offset += 1;
      value = (function() {
        switch (type) {
          case TYPE_UNDEFINED:
            return this.readUndefined();
          case TYPE_NULL:
            return this.readNull();
          case TYPE_BOOL_FALSE:
            return this.readBoolFalse();
          case TYPE_BOOL_TRUE:
            return this.readBoolTrue();
          case TYPE_INTEGER:
            return this.readInteger();
          case TYPE_NUMBER:
            return this.readNumber();
          case TYPE_STRING:
            return this.readString();
          case TYPE_XML:
            return this.readXML();
          case TYPE_DATE:
            return this.readDate();
          case TYPE_ARRAY:
            return this.readArray();
          case TYPE_OBJECT:
            return this.readObject();
          case TYPE_XMLSTRING:
            return this.readXMLString();
          case TYPE_BYTEARRAY:
            return this.readByteArray();
          default:
            return console.log('Unknown type');
        }
      }).call(this);
      return value;
    };

    Decoder.prototype.getByte = function() {
      var byte;
      byte = this.buffer[this.offset];
      this.offset += 1;
      return byte;
    };

    Decoder.prototype.readUndefined = function() {
      return void 0;
    };

    Decoder.prototype.readNull = function() {
      return null;
    };

    Decoder.prototype.readBoolFalse = function() {
      return false;
    };

    Decoder.prototype.readBoolTrue = function() {
      return true;
    };

    Decoder.prototype.readNumber = function() {
      var number;
      number = this.buffer.readDoubleBE(this.offset, this.endian);
      this.offset += 8;
      return new Float(number);
    };

    Decoder.prototype.readInteger = function(signed) {
      if (signed == null) {
        signed = true;
      }
      return this._decodeInt(signed);
    };

    Decoder.prototype.readString = function() {
      var isReference, length, str, _ref;
      _ref = this._readLength(), length = _ref[0], isReference = _ref[1];
      if (isReference) {
        str = this.getStringFromReference(length);
        return str;
      }
      if (length === 0) {
        return '';
      }
      str = this.buffer.toString('utf8', this.offset, this.offset + length);
      this.offset += length;
      this.addString(str);
      return str;
    };

    Decoder.prototype.readDate = function() {
      var d, idx, ref, u;
      ref = this.readInteger(false);
      if (ref & 1) {
        u = this.readNumber();
        d = new Date(u);
        this.addObject(d);
        return d;
      } else {
        idx = ref >> 1;
        return this.getObjectFromReference(idx);
      }
    };

    Decoder.prototype.readArray = function() {
      var i, key, length, object, _i;
      length = this.readInteger(false);
      if ((length & REFERENCE_BIT) === 0) {
        return this.getObjectFromReference(length >> 1);
      }
      length = length >> 1;
      key = this.readString();
      if (length === 0) {
        return [];
      }
      if (key === '' || key === null) {
        object = (function() {
          var _i, _results;
          _results = [];
          for (i = _i = 1; 1 <= length ? _i <= length : _i >= length; i = 1 <= length ? ++_i : --_i) {
            _results.push(this.readValue());
          }
          return _results;
        }).call(this);
        this.addObject(object);
        return object;
      } else {
        object = {};
        while (key) {
          object[key] = this.readValue();
          key = this.readString();
        }
        for (i = _i = 1; 1 <= length ? _i <= length : _i >= length; i = 1 <= length ? ++_i : --_i) {
          object[i] = this.readValue();
        }
        this.addObject(object);
        return object;
      }
    };

    Decoder.prototype.readObject = function() {
      var classData, encodingRef, idx, klass, name, object, ref, thing;
      ref = this.readInteger(false);
      object = null;
      if ((ref & REFERENCE_BIT) === 0) {
        return this.getObjectFromReference(ref >> 1);
      }
      if (ref & 1) {
        if (ref & 2) {
          if (ref & 4) {
            ref = ref >> 1;
            klass = this._getClassDefinition(ref);
            object = klass._readamf(this);
          } else {
            name = this.readString();
            encodingRef = ref >> 1;
            encodingRef = encodingRef >> 1;
            thing = new ASObject(name);
            thing.encoding = encodingRef & 0x03;
            if (thing.encoding === ObjectEncoding.STATIC) {
              thing._readKeys(this, ref);
            }
            this.addClass(name, thing);
            object = thing._readamf(this);
          }
        } else {
          idx = ref >> 2;
          classData = this.getClassFromReference(idx);
          klass = classData.klass;
          object = klass._readamf(this);
        }
        this.addObject(object);
      } else {
        idx = ref >> 1;
        return this.getObjectFromReference(idx);
      }
      return object;
    };

    Decoder.prototype.readByteArray = function() {
      var data, idx, length, ref;
      ref = this.readInteger(false);
      if (ref & 1) {
        length = ref >> 1;
        data = this.buffer.slice(this.offset, this.offset + length);
        this.offset += length;
        this.addObject(data);
        return data;
      } else {
        idx = ref >> 1;
        return this.getObjectFromReference(idx);
      }
    };

    Decoder.prototype._readLength = function() {
      var x;
      x = this.readInteger(false);
      return [x >> 1, (x & REFERENCE_BIT) === 0];
    };

    Decoder.prototype._getClassDefinition = function(ref) {
      var AcknowledgeMessage, ArrayCollection, isRef, name, thing;
      isRef = (ref & REFERENCE_BIT) === 0;
      ref = ref >> 1;
      if (isRef) {
        return this.getClassFromReference(ref);
      }
      name = this.readString();
      if (name === 'DSK') {
        AcknowledgeMessage = require('./messaging').AcknowledgeMessage;
        thing = new AcknowledgeMessage();
      } else if (name === 'flex.messaging.io.ArrayCollection') {
        ArrayCollection = require('./messaging').ArrayCollection;
        thing = new ArrayCollection();
      } else if (name === 'flex.messaging.messages.RemotingMessage') {

      } else {
        process.exit();
      }
      this.addClass(name, thing);
      return thing;
    };

    Decoder.prototype._decodeInt = function(signed) {
      var b, n, result;
      if (signed == null) {
        signed = false;
      }
      n = result = 0;
      b = this.buffer[this.offset];
      this.offset += 1;
      while ((b & 0x80) !== 0 && (n < 3)) {
        result = (result << 7) | (b & 0x7F);
        b = this.buffer[this.offset];
        this.offset += 1;
        n += 1;
      }
      if (n < 3) {
        result = (result << 7) | b;
      } else {
        result = (result << 8) | b;
        if ((result & 0x10000000) !== 0) {
          if (signed) {
            result -= 0x20000000;
          } else {
            result = result << 1;
            result += 1;
          }
        }
      }
      return result;
    };

    return Decoder;

  })(AMFContext);

  typeOf = function(object) {
    var funcNameRegex, results;
    if (object === null) {
      return null;
    }
    if (object === void 0) {
      return void 0;
    }
    funcNameRegex = /function (.{1,})\(/;
    results = funcNameRegex.exec(object.constructor.toString());
    if (results && results.length > 1) {
      return results[1];
    } else {
      return '';
    }
  };

  Encoder = (function(_super) {
    __extends(Encoder, _super);

    Encoder.prototype.endian = 'big';

    Encoder.prototype.offset = 0;

    Encoder.prototype.buffers = [];

    function Encoder(buffer, offset) {
      this.buffer = buffer;
      this.offset = offset != null ? offset : 0;
      if (!this.buffer) {
        this.buffer = new Buffer(10485760);
      }
    }

    Encoder.prototype.getBuffer = function() {
      return this.buffer.slice(0, this.offset);
    };

    Encoder.prototype.writeValue = function(value) {
      switch (typeOf(value)) {
        case null:
          return this.writeNull();
        case void 0:
          return this.writeUndefined();
        case "Float":
          return this.writeNumber(value.value);
        case "Number":
          return this.writeInteger(value);
        case "String":
          return this.writeString(value);
        case "Array":
          return this.writeArray(value);
        case "Object":
          return this.writeObject(value);
        case "Boolean":
          return this.writeBoolean(value);
        case "Buffer":
          return this.writeByteArray(value);
        case "Date":
          return this.writeDate(value);
        default:
          return this.writeObject(value);
      }
    };

    Encoder.prototype.writeType = function(type) {
      this.buffer[this.offset] = type;
      return this.offset += 1;
    };

    Encoder.prototype.writeBoolean = function(bool) {
      if (bool) {
        return this.writeType(TYPE_BOOL_TRUE);
      } else {
        return this.writeType(TYPE_BOOL_FALSE);
      }
    };

    Encoder.prototype.writeUndefined = function() {
      return this.writeType(TYPE_UNDEFINED);
    };

    Encoder.prototype.writeNull = function() {
      return this.writeType(TYPE_NULL);
    };

    Encoder.prototype.writeNumber = function(num, writeType) {
      if (writeType == null) {
        writeType = true;
      }
      if (writeType) {
        this.writeType(TYPE_NUMBER);
      }
      this.buffer.writeDoubleBE(num, this.offset, this.endian);
      return this.offset += 8;
    };

    Encoder.prototype.writeInteger = function(num, writeType) {
      var byte, _i, _len, _ref, _results;
      if (writeType == null) {
        writeType = true;
      }
      if (num < MIN_29B_INT || num > MAX_29B_INT) {
        return this.writeNumber(num, writeType);
      } else {
        if (writeType) {
          this.writeType(TYPE_INTEGER);
        }
        _ref = this._encodeInteger(num);
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          byte = _ref[_i];
          this.buffer[this.offset] = byte;
          _results.push(this.offset += 1);
        }
        return _results;
      }
    };

    Encoder.prototype.writeString = function(str, writeType) {
      var flag, len, ref;
      if (writeType == null) {
        writeType = true;
      }
      if (writeType) {
        this.writeType(TYPE_STRING);
      }
      len = Buffer.byteLength(str);
      if (len === 0) {
        this.writeType(REFERENCE_BIT);
        return;
      }
      ref = this.getStringReference(str);
      if (ref !== -1) {
        this.writeInteger(ref << 1, false);
        return;
      }
      this.addString(str);
      flag = (len << 1) | REFERENCE_BIT;
      this.writeInteger(flag, false);
      this.buffer.write(str, this.offset, 'utf8');
      return this.offset += len;
    };

    Encoder.prototype.writeArray = function(ary, isProxy) {
      var flag, ref, value, _i, _len, _results;
      if (isProxy == null) {
        isProxy = false;
      }
      this.writeType(TYPE_ARRAY);
      ref = this.getObjectReference(ary);
      if (ref !== -1) {
        this.writeInteger(ref << 1, false);
        return;
      }
      this.addObject(ary);
      flag = (ary.length << 1) | REFERENCE_BIT;
      this.writeInteger(flag, false);
      this.buffer[this.offset] = 0x01;
      this.offset += 1;
      _results = [];
      for (_i = 0, _len = ary.length; _i < _len; _i++) {
        value = ary[_i];
        _results.push(this.writeValue(value));
      }
      return _results;
    };

    Encoder.prototype.writeDict = function(object, isProxy) {
      var flag, int, intKeys, key, ref, strKeys, value, _i, _j, _k, _len, _len1, _len2, _results;
      if (isProxy == null) {
        isProxy = false;
      }
      this.writeType(TYPE_ARRAY);
      ref = this.getObjectReference(object);
      if (ref !== -1) {
        this.writeInteger(ref << 1);
        return;
      }
      this.addObject(object);
      intKeys = [];
      strKeys = [];
      for (key in object) {
        if (!__hasProp.call(object, key)) continue;
        value = object[key];
        if (Number(key) !== NaN && Math.floor(Number(key)) === Number(key)) {
          intKeys.push(key);
        } else {
          strKeys.push(key.toString());
        }
      }
      for (_i = 0, _len = intKeys.length; _i < _len; _i++) {
        int = intKeys[_i];
        if ((intKeys.length < int && int <= 0)) {
          strKeys.push(int.toString());
          intKeys = intKeys.filter(function(item) {
            return item !== int;
          });
        }
      }
      intKeys.sort();
      flag = (intKeys.length << 1) | REFERENCE_BIT;
      this.writeInteger(flag, false);
      for (_j = 0, _len1 = strKeys.length; _j < _len1; _j++) {
        key = strKeys[_j];
        this.writeString(key, false);
        this.writeValue(object[key]);
      }
      this.writeType(0x01);
      _results = [];
      for (_k = 0, _len2 = intKeys.length; _k < _len2; _k++) {
        int = intKeys[_k];
        _results.push(this.writeValue(object[int]));
      }
      return _results;
    };

    Encoder.prototype.writeObject = function(object, isProxy) {
      var classData, className, classRef, definition, finalRef, idx, key, ref, _i, _len, _ref;
      if (isProxy == null) {
        isProxy = false;
      }
      this.writeType(TYPE_OBJECT);
      ref = this.getObjectReference(object);
      if (ref !== -1) {
        this.writeInteger(ref << 1);
        return;
      }
      className = object.alias || object.name;
      this.addObject(object);
      idx = this.getClassReference(className);
      classRef = false;
      if (idx !== -1) {
        classRef = true;
        classData = this.getClassFromReference(idx);
        definition = classData.klass;
      } else {
        classData = this.findClass(typeOf(object));
        if (classData) {
          definition = classData.klass;
        } else {
          definition = require('./messaging').ASObject;
          definition.name = object.name;
        }
        this.addClass(className, definition);
        classData = this._classReferences[this._classReferences.length - 1];
      }
      if (classRef) {
        this.writeInteger(classData.reference, false);
      } else {
        ref = 0;
        if (object.encoding !== ObjectEncoding.EXTERNAL) {
          ref += object.keys.length << 4;
        }
        finalRef = ref | (object.encoding << 2) | (REFERENCE_BIT << 1) | REFERENCE_BIT;
        this.writeInteger(finalRef, false);
        classData.reference = (classData.reference << 2) | REFERENCE_BIT;
      }
      if (!classRef) {
        this.writeString(className, false);
        if (object.encoding !== ObjectEncoding.EXTERNAL) {
          _ref = object.keys;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            key = _ref[_i];
            this.writeString(key, false);
          }
        }
      }
      return object._writeamf(this);
    };

    Encoder.prototype.writeDate = function(date) {
      var ref;
      this.writeType(TYPE_DATE);
      ref = this.getObjectReference(date);
      if (ref !== -1) {
        this.writeInteger(ref << 1, false);
        return;
      }
      this.addObject(date);
      this.writeType(REFERENCE_BIT);
      if (date.getTime) {
        return this.writeNumber(date.getTime(), false);
      } else {
        return this.writeNumber(date, false);
      }
    };

    Encoder.prototype.writeByteArray = function(buffer) {
      var ref;
      this.writeType(TYPE_BYTEARRAY);
      ref = this.getObjectReference(buffer);
      if (ref !== -1) {
        this.writeInteger(ref << 1, false);
        return;
      }
      this.addObject(buffer);
      this.writeInteger((buffer.length << 1) | REFERENCE_BIT, false);
      buffer.copy(this.buffer, this.offset);
      return this.offset += buffer.length;
    };

    Encoder.prototype._encodeInteger = function(num) {
      var bytes, realValue;
      if (num < 0) {
        num += 0x20000000;
      }
      bytes = [];
      realValue = null;
      if (num > 0x1fffff) {
        realValue = num;
        num = num >> 1;
        bytes.push(0x80 | ((num >> 21) & 0xff));
      }
      if (num > 0x3fff) {
        bytes.push(0x80 | ((num >> 14) & 0xff));
      }
      if (num > 0x7f) {
        bytes.push(0x80 | ((num >> 7) & 0xff));
      }
      if (realValue === !null) {
        num = realValue;
      }
      if (num > 0x1fffff) {
        bytes.push(num & 0xff);
      } else {
        bytes.push(num & 0x7f);
      }
      return bytes;
    };

    return Encoder;

  })(AMFContext);

  exports.ObjectEncoding = ObjectEncoding;

  exports.Decoder = Decoder;

  exports.Encoder = Encoder;

}).call(this);
