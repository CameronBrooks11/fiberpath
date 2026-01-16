# TODO

Tasks for Cam todo:

- [ ] Review logic of how the various patterns are constructing and give tool tips or tables or aids or something or other to help users understand what the patterns are doing and how to use them effectively. The only relevant one right now is helical where it often gives circuit mismatch errors but its unclear where the raised number values come from / derive from their inputs in the properties panel.

- [ ] Add more detailed documentation for the various winding patterns and their parameters, including visual aids to help users understand concepts like wind angle, pattern number, skip index, and lock degrees.

- [ ] Research and develop new relevant wind patterns that could be useful for users, such as geodesic patterns or variable angle profiles.

- [ ] Figure out if it's possible and feasible to recognize `.wind` files on various systems to open fiberpath by default

- [ ] Implement machine connection info panel in the GUI, connect to Marlin to get example of the connection message upon connection, parse it (already have code that does this in the python lib) and display it in a side pane next to the log output in the stream tab. Consider how to handle refreshing the info, locking during jobs, and initial state before connection.

- [ ] Design a logo and replace the placeholder icon with an actual logo

- [ ] Fix zooming behavior in the plot viewer so it expands the entire image not within the image bounds since this becomes an issue for larger (exceeds bounds) or smaller (impossible to look at properly) images
