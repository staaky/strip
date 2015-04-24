# Strip

_A Less Intrusive Responsive Lightbox_

Strip is a Lightbox that only partially covers the page. This is less intrusive and leaves room to interact with the page on larger screens while giving smaller mobile devices the classic Lightbox experience.

See [stripjs.com](http://www.stripjs.com) for demos and docs.

[![screenshot](https://cloud.githubusercontent.com/assets/5575/4969788/ec4fc80e-686c-11e4-8406-614db6980325.jpg)](http://www.stripjs.com)

## Install

Install with [Bower](http://bower.io): `bower install strip`

[Install with npm](http://npmjs.com/package/@staaky/strip): `npm install @staaky/strip`

## License

Strip may be used in commercial projects and applications with the one-time purchase of a commercial license. If you are paid to do your job, and part of your job is implementing Strip, a commercial license is required.

[http://www.stripjs.com/license](http://www.stripjs.com/license)

For non-commercial projects and applications, you may use Strip under the terms of the [Creative Commons BY-NC-ND 3.0 License](http://creativecommons.org/licenses/by-nc-nd/3.0/) for free.

## Build

The latest release can be found on [stripjs.com/download](http://www.stripjs.com/download).

To build Strip yourself start by cloning a copy of the main Strip git repo by running:

```
git clone git://github.com/staaky/strip.git
```

Go inside the strip folder that was just fetched and install dependencies:

```
cd strip && npm install
```

Make sure the [grunt command line interface](https://github.com/gruntjs/grunt-cli) is installed as a global package:

```
npm install -g grunt-cli
```

Now run the `grunt` command, this updates files in `dist` to include the latest changes made in the `src` folder:

```
grunt
```

* * *

By [Nick Stakenburg](http://www.nickstakenburg.com)
