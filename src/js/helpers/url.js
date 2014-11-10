// uses Types to scan a URI for info
function getURIData(url) {
  var result = { type: 'image' };
  $.each(Types, function(i, type) {
    var data = type.data(url);
    if (data) {
      result = data;
      result.type = i;
      result.url = url;
    }
  });

  return result;
}

function detectExtension(url) {
  var ext = (url || '').replace(/\?.*/g, '').match(/\.([^.]{3,4})$/);
  return ext ? ext[1].toLowerCase() : null;
}


var Types = {
  'image': {
    extensions: 'bmp gif jpeg jpg png webp',
    detect: function(url) {
      return $.inArray(detectExtension(url), this.extensions.split(' ')) > -1;
    },
    data: function(url) {
      if (!this.detect()) return false;

      return {
        extension: detectExtension(url)
      };
    }
  },

  'youtube': {
    detect: function(url) {
      var res = /(youtube\.com|youtu\.be)\/watch\?(?=.*vi?=([a-zA-Z0-9-_]+))(?:\S+)?$/.exec(url);
      if (res && res[2]) return res[2];

      res = /(youtube\.com|youtu\.be)\/(vi?\/|u\/|embed\/)?([a-zA-Z0-9-_]+)(?:\S+)?$/i.exec(url);
      if (res && res[3]) return res[3];

      return false;
    },
    data: function(url) {
      var id = this.detect(url);
      if (!id) return false;

      return {
        id: id
      };
    }
  },

  'vimeo': {
    detect: function(url) {
      var res = /(vimeo\.com)\/([a-zA-Z0-9-_]+)(?:\S+)?$/i.exec(url);
      if (res && res[2]) return res[2];

      return false;
    },
    data: function(url) {
      var id = this.detect(url);
      if (!id) return false;

      return {
        id: id
      };
    }
  }
};

