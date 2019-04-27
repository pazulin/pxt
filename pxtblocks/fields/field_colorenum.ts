namespace pxtblockly {
    export interface FieldColorEnumOptions extends pxtblockly.FieldColourNumberOptions {
        enumClassName?: string;
    }

    export class FieldColorEnum extends pxtblockly.FieldColorNumber implements Blockly.FieldCustom {
        public isFieldCustom_ = true;
        public enumClassName: string;

        constructor(text: string, params: FieldColorEnumOptions, opt_validator?: Function) {
            super(text, params, opt_validator);
            this.enumClassName = params.enumClassName || 'ColorSensorColor';
        }

        mapColour(enumString: string) {
            switch (enumString) {
                case '#000000': return this.enumClassName + 'Black';
                case '#006db3': return this.enumClassName + 'Blue';
                case '#00934b': return this.enumClassName + 'Green';
                case '#ffd01b': return this.enumClassName + 'Yellow';
                case '#f12a21': return this.enumClassName + 'Red';
                case '#ffffff': return this.enumClassName + 'White';
                case '#6c2d00': return this.enumClassName + 'Brown';
                default: return this.enumClassName + 'None';
            }
        }

        mapEnum(colorString: string) {
            switch (colorString.replace(/^*.\./, '').toLowerCase()) {
                case 'black': return '#000000';
                case 'blue': return '#006db3';
                case 'green': return '#00934b';
                case 'yellow': return '#ffd01b';
                case 'red': return '#f12a21';
                case 'white': return '#ffffff';
                case 'brown': return '#6c2d00';
                case 'none': return '#dfe6e9'; // Grey
                default: return colorString;
            }
        }

        /**
         * Return the current colour.
         * @param {boolean} opt_asHex optional field if the returned value should be a hex
         * @return {string} Current colour in '#rrggbb' format.
         */
        getValue(opt_asHex?: boolean) {
            const colour = this.mapColour(this.colour_);
            if (!opt_asHex && colour.indexOf('#') > -1) {
                return `0x${colour.replace(/^#/, '')}`;
            }
            return colour;
        }

        /**
         * Set the colour.
         * @param {string} colour The new colour in '#rrggbb' format.
         */
        setValue(colorStr: string) {
            const colour = this.mapEnum(colorStr);
            if (this.sourceBlock_ && Blockly.Events.isEnabled() &&
                this.colour_ != colour) {
                Blockly.Events.fire(new (Blockly as any).Events.BlockChange(
                    this.sourceBlock_, 'field', this.name, this.colour_, colour));
            }
            this.colour_ = colour;
            if (this.sourceBlock_) {
                this.sourceBlock_.setColour(colour, colour, colour);
            }
        }
    }
}