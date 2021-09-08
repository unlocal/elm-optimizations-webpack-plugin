module Main exposing (main)

import Browser
import Browser.Events
import Html exposing (Html, div, text)

main =
    Browser.element
        { init = init
        , update = update
        , view = view
        , subscriptions = subscriptions
        }

type Msg = Reset

type alias Model = {}

init : () -> ( Model, Cmd Msg)
init flags = ( {}, Cmd.none )

update : Msg -> Model -> ( Model, Cmd Msg )
update msg model = ( model, Cmd.none )

subscriptions : Model -> Sub Msg
subscriptions _ = Browser.Events.onResize (\_ _ -> Reset)

view : Model -> Html Msg
view model = div [] [ text "Hello, from Main.elm!" ]
