<Page:>
    <!DOCTYPE html>
    <html class="b-html" id="nojs">
        <head>
            <meta charset="utf-8">
            <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
            <meta name="viewport" content="width = device-width, initial-scale = 1.0">
            <script>document.documentElement.id = 'js';</script>
            
            <link href='http://fonts.googleapis.com/css?family=Open+Sans:400,300,300italic,400italic,600,600italic,700,700italic' rel='stylesheet' type='text/css'>
            <view is="{{$render.prefix}}TitleElement"></view>
            <view is="{{$render.prefix}}StylesLinks" optional></view>
            <view is="{{$render.prefix}}Styles"></view>
            <view is="{{$render.prefix}}Head" optional></view>
        </head>
        <view is="{{$render.prefix}}BodyElement"></view>
    </html>
</Page:>

<BodyServer:>
    <!--{{!desktop}}
        <script src="/d/js/hammer/hammer.js"></script>
    {{/!desktop}}-->
    __DERBY_BUNDLE__
    <view is="{{$render.prefix}}AppScript"></view>
    <view is="{{$render.prefix}}Tail"></view>
</BodyServer:>