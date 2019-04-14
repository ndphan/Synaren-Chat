import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Description, Title } from './SynarenCard.styles';


class SynarenCard extends PureComponent {

  isEven() {
    return this.props.index % 2;
  }

  description() {
    const props = this.props;
    const isEven = this.isEven();
    return (
      <div style={props.descriptionStyle} className={`${isEven ? "uk-tile-primary" : "uk-tile-default"} uk-padding-small uk-tile uk-height-medium`}>
        <Title>
          {props.header}
          {props.link}
        </Title>
        {
          props.description ? (
            <Description>
              {props.description}
            </Description>
          ) : undefined
        }
      </div>
    )
  }

  content() {
    const props = this.props;
    const isEven = this.isEven();
    return (
      <div className={`${!isEven ? "uk-tile-primary" : "uk-tile-default"}  uk-tile uk-height-medium`} style={{ padding: 0, ...props.contentStyle}}>
        {props.content}
      </div>
    )
  }

  render() {
    const props = this.props;
    const isEven = this.isEven();
    return (
      <div
        className={`${!props.isImageCard ? "uk-child-width-1-2@s uk-child-width-1-1" : "uk-child-width-1-1@s uk-child-width-1-1"} uk-grid-collapse uk-text-center`}
        uk-grid="true"
        style={{ margin: "0 10px", borderRadius: "2px" }}
      >
        <div>
          {props.isImageCard ? (!props.isImageCardReverse ? this.description() : this.content()) : isEven ? this.content() : this.description()}
        </div>
        <div>
          {props.isImageCard ? (!props.isImageCardReverse ? this.content() : this.description()) : !isEven ? this.content() : this.description()}
        </div>
      </div>
    );
  }
}

SynarenCard.propTypes = {
  content: PropTypes.element,
  header: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  link: PropTypes.element,
  description: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  index: PropTypes.number,
  contentStyle: PropTypes.object,
  isImageCard: PropTypes.bool,
  isImageCardReverse: PropTypes.bool,
  descriptionStyle: PropTypes.object
};

SynarenCard.defaultProps = {
  content: <div />,
  link: <a />,
  description: "",
  contentStyle: {},
  isImageCard: false,
  isImageCardReverse: false,
  descriptionStyle: {}
};

export default SynarenCard;
