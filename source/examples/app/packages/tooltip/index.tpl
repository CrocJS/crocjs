<!-- +use jquery-ui -->

<Title:>
    Croc JS Form Example
</Title:>

<Head:>
    <style>
        #target {
            width: 100px;
            height: 100px;
            position: fixed;
            background: #c0c0c0;
            z-index: 20;
            }
        #form {
            position: fixed;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.1);
            width: 900px;
            padding: 10px;
            z-index: 10;
            }
        #form .b-form-label.pos_left {
            width: 120px;
            }
        #form .b-form-fset:nth-child(1) {
            height: 412px;
            overflow: auto;
            -moz-column-count: 2;
            -webkit-column-count: 2;
            column-count: 2;
            -moz-column-gap: 20px;
            -webkit-column-gap: 20px;
            column-gap: 20px;
            overflow: hidden;
            }
        #form .b-form-row {
            width: 100%;
            }
        #form .b-form-group.dir_ttb.type_radio.is_columns,
        #form .b-form-group.dir_ttb.type_checkbox {
            -moz-column-count: 2;
            -webkit-column-count: 2;
            column-count: 2;
            }
        #form .b-form-check {
            position: relative;
            }
        #form textarea {
            height: 95px !important;
            }
        .ui-resizable-handle {
            background: #ffff00;
            opacity: 0.3;
            }
        .delegate {
            color: #fff;
            background-color: #144212;
            width: 80px;
            height: 80px;
            padding: 10px;
            position: absolute;
            }
    </style>
</Head:>

<Body:>
    <div class="b-page">
        <div id="target" style="left: 170px; top: 170px;"></div>
        <div id="delegates">
            <div class="delegate" style="left: 10px; top: 10px;">Delegate 1</div>
            <div class="delegate" style="left: 10px; top: 300px;">Delegate 2</div>
            <div class="delegate" style="left: 200px; top: 10px;">Delegate 3</div>
            <div class="delegate" style="left: 200px; top: 300px;">Delegate 4</div>
        </div>
        
        <widget is="croc.cmp.form.Form"
            labels="{{{position: 'left', size: '1'}}}"
            ddefaults="{{{size: '1'}}}"
            stateManager="{{{removeEmptyValue: false}}}"
            attrs="{{{id: 'form'}}}"
            as="form">
            <passView is="body">
                <view is=":fieldset">
                    <view is=":row" label="class">
                        <widget is="croc.cmp.form.field.RadioButtonsGroup" identifier="class" value="{{tooltipClass}}">
                            <item value="Tooltip" checked>croc.cmp.tooltip.Tooltip</item>
                            <item value="Pointer">croc.cmp.tooltip.Pointer</item>
                        </widget>
                    </view>
                    <view is=":row" label="content">
                        <widget is="croc.cmp.form.field.TextArea" identifier="content"/>
                    </view>
                    <view is=":row" label="position">
                        {{if tooltipClass === 'Tooltip'}}
                            <widget is="croc.cmp.form.field.RadioButtonsSet" identifier="position">
                                <button value="left" checked>left</button>
                                <button value="top">top</button>
                                <button value="bottom">bottom</button>
                                <button value="right">right</button>
                                <button value="center">center</button>
                            </widget>
                        {{else}}
                            <widget is="croc.cmp.form.field.RadioButtonsSet" identifier="position">
                                <button value="left">left</button>
                                <button value="right" checked>right</button>
                            </widget>
                        {{/if}}
                    </view>
                    <view is=":row" label="hAlign">
                        <widget is="croc.cmp.form.field.RadioButtonsGroup" class="is_columns" identifier="hAlign">
                            <item value="left">left</item>
                            <item value="centerLeft">centerLeft</item>
                            <item value="center" checked>center</item>
                            <item value="centerRight">centerRight</item>
                            <item value="right">right</item>
                        </widget>
                    </view>
                    <view is=":row" label="vAlign">
                        <widget is="croc.cmp.form.field.RadioButtonsGroup" class="is_columns" identifier="vAlign">
                            <item value="top">top</item>
                            <item value="middleTop">middleTop</item>
                            <item value="middle" checked>middle</item>
                            <item value="middleBottom">middleBottom</item>
                            <item value="bottom">bottom</item>
                        </widget>
                    </view>
                    <view is=":row" label="scheme">
                        {{if tooltipClass === 'Tooltip'}}
                            <widget is="croc.cmp.form.field.RadioButtonsSet" identifier="scheme">
                                <button value="white" checked>white</button>
                                <button value="red">red</button>
                            </widget>
                        {{else}}
                            <widget is="croc.cmp.form.field.RadioButtonsSet" identifier="scheme">
                                <button value="yellow" checked>yellow</button>
                                <button value="red">red</button>
                                <button value="blue">blue</button>
                            </widget>
                        {{/if}}
                    </view>
                    <view is=":row" label="sequence" labelHint="autoPositioningSequence">
                        {{if tooltipClass === 'Tooltip'}}
                            <widget is="croc.cmp.form.field.CheckBoxesGroup" identifier="autoPositioningSequence" arrayValues="{{true}}">
                                <item value="top" checked>top</item>
                                <item value="right" checked>right</item>
                                <item value="bottom" checked>bottom</item>
                                <item value="left" checked>left</item>
                            </widget>
                        {{else}}
                            <widget is="croc.cmp.form.field.CheckBoxesGroup" identifier="autoPositioningSequence" arrayValues="{{true}}">
                                <item value="right" checked>right</item>
                                <item value="left" checked>left</item>
                            </widget>
                        {{/if}}
                    </view>
                    <view is=":row" label="autoSizeGap">
                        <widget is="croc.cmp.form.field.TextField" identifier="autoSizeGap"/>
                    </view>
                    <view is=":row" label="openDelay">
                        <widget is="croc.cmp.form.field.TextField" identifier="openDelay"/>
                    </view>
                    <view is=":row" label="showAnimation">
                        <widget is="croc.cmp.form.field.RadioButtonsSet" identifier="showAnimation">
                            <button value="{{null}}" checked>none</button>
                            <button value="fade">fade</button>
                            <button value="fly">fly</button>
                        </widget>
                    </view>
                    <view is=":row" label="hideAnimation">
                        <widget is="croc.cmp.form.field.RadioButtonsSet" identifier="hideAnimation">
                            <button value="{{null}}">none</button>
                            <button value="fade" checked>fade</button>
                            <button value="fly">fly</button>
                        </widget>
                    </view>
                    <view is=":row" label="triggerOptions">
                        <widget is="croc.cmp.form.field.CheckBoxesGroup"
                            identifier="triggerOptions"
                            exportsValues="{{false}}"
                            removeUnchecked="{{false}}">
                            <item name="openOnMouseenter" checked>openOnMouseenter</item>
                            <item name="closeOnMouseleave">closeOnMouseleave</item>
                            <item name="openOnClick">openOnClick</item>
                            <item name="openOnClickImmediately" checked>openOnClickImmediately</item>
                            <item name="closeOnClick">closeOnClick</item>
                        </widget>
                    </view>
                    <view is=":row" label="options">
                        <widget is="croc.cmp.form.field.CheckBoxesGroup"
                            identifier="triggerOptions"
                            removeUnchecked="{{false}}">
                            <item name="autoClose">autoClose</item>
                            <item name="autoPositioning" checked>autoPositioning</item>
                            <item name="autoShift" checked>autoShift</item>
                            <item name="autoSize">autoSize</item>
                            <item name="closeOnHtmlClick" checked>closeOnHtmlClick</item>
                            <item name="closeOnResize">closeOnResize</item>
                            <item name="closeOnScroll">closeOnScroll</item>
                            <item name="dynamicPositioning" checked>dynamicPositioning</item>
                            <item name="triggerSelector">triggerSelector</item>
                            <item name="target: mouseTrigger">target: mouseTrigger</item>
                            <item name="keepActualPosition" checked><b>keepActualPosition</b></item>
                            <item name="positionInset">positionInset</item>
                        </widget>
                    </view>
                </view>
            </passView>
            <passView is="buttons">
                <widget is="croc.cmp.form.Button" text="Show" on-click="showTooltip()"/>
                <widget is="croc.cmp.form.Button" text="Destroy" on-click="destroyTooltip()"/>
            </passView>
        </widget>
    </div>
</Body:>