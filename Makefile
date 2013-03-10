DEPS=deps/underscore.js deps/raphael.js

SRC=src/pythia.js                     \
    src/pythia.class.js               \
    src/pythia.color.js               \
\
    src/pythia.element.js             \
    src/pythia.port.js                \
    src/pythia.element.path.js        \
    src/pythia.element.rect.js        \
    src/pythia.line.js                \
    src/pythia.axis.js                \
    src/pythia.text.js                \
    src/pythia.element.circleslice.js \
\
    src/pythia.chart.js             \
    src/pythia.chart.bar.js         \
    src/pythia.chart.line.js        \
    src/pythia.chart.pie.js         \
\
    src/pythia.canvas.js            \
\
    src/pythia.renderer.js          \
    src/pythia.renderer.raphael.js  \
#   src/pythia.renderer.canvas.js   \
#   src/pythia.chart.sankey.js      \


pythia.js: Makefile $(DEPS) $(SRC)
	cat $(DEPS) $(SRC) > $@

clean:
	rm -f pythia.js pythia.min.js

#QUIET, DEFAULT, VERBOSE
WARNING_LEVEL=DEFAULT
#default:
#	closure-compiler \
#		--warning_level $(WARNING_LEVEL) \
#		--js_output_file pythia.dist.js \
#		--js $(DEPS) $(SRC)
