<Title:>
    Croc JS Form Example
</Title:>

<Body:>
    <div class="b-page">
        {{client}}
            <widget is="croc.cmp.form.Form">
                <passView is="body">
                    <view is=":fieldset">
                        <view is=":row" label="{{{size: '3', text: 'first'}}}" hint="field hint">
                            <widget is="croc.cmp.form.field.TextField" identifier="first" size="3"></widget>
                        </view>
                    </view>
                </passView>
                <passView is="buttons">
                    <widget is="croc.cmp.form.Button" text="Form submit button" type="submit"></widget>
                </passView>
            </widget>
        {{/client}}
    </div>
</Body:>